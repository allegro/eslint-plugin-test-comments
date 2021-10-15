import { defaultRuleTester, withOptions } from './testUtils';
import {
  getSuccessors,
  TestComments,
  testCommentsRule as rule,
} from '../test-comments';

const ruleTester = defaultRuleTester();

const buildMessage = (
  predecessor: TestComments,
  wrongType: TestComments
): string => {
  const comment = { value: `${predecessor}` };
  return `'${wrongType}' is not allowed here; instead, use one of: [${getSuccessors(
    comment as any
  ).join(', ')}]`;
};

const valid = [
  {
    code: `
    it.each\`
        var1 | var2
        val1 | val2
    \`('test', () => {
        // when
        const wrapper = wrapper;
        // then
        expect(true);
    });
    `,
  },
  {
    code: `
    test.each\`
        var1 | var2
        val1 | val2
    \`('test', () => {
        // when
        const wrapper = wrapper;
        // then
        expect(true);
    });
    `,
  },
  {
    code: `
    it('test', () => {
        // then
        // and
        // then
    });
    `,
  },
  {
    code: `
    // given
    boo('test', () => {
        // given
        const wizard = buildWizard();
        // given
        wizard.doAction();
        action();
        // when
        expect(wizard.toBeNice());
    });
    // then
    `,
  },
  {
    code: `
    // given
    test('test', () => {
        // given
        const wizard = buildWizard();
        // when
        wizard.doAction();
        // then
        expect(wizard.toBeNice());
    });
    // then
    `,
  },
  {
    code: `
    // given
    it('test', () => {
        // given
        const wizard = buildWizard();
        // when
        wizard.doAction();
        // then
        expect(wizard.toBeNice());
    });
    // then
    `,
  },
  {
    code: `
    // given
    it('test', () => {
        // given
        // when
        // then
    });
    // then
    `,
  },
  {
    code: `
    it('test', () => {
        // given
        // other comment
        // when
        // other comment
        // other comment
        // then
        // other comment
    });
    `,
  },
  {
    code: `
    it('test', () => {
        // given
        // and
        // when
        // and
        // and
        // and
        // then
        // and
        // and
    });
    `,
  },
  {
    code: `
    it('test', () => {
        // when
        // then
        // and
    });
    `,
  },
  {
    code: `
    it('test', () => {
        // then
        // and
    });
    `,
  },
  {
    code: `
    it('test', () => {
        // GIveN
        // WHEN
        // then
        // ANd the rest of the comment
    });
    `,
  },
  {
    code: `
    it('test', () => {
        // given something 
        // when something else 
        // then something 
    });
    `,
  },
  {
    code: `
    it('test', () => {
        // given
        const tab = tab;
        // expect
        expect(viewerItemSelected(tab, Permission.GOOGLE)).toBe(false);
    });
    `,
  },
  {
    code: `
    it.todo('test', () => {});
    `,
  },
  withOptions({ allowNoComments: true })({
    code: `
    it('test', () => {});
    `,
  }),
];

const invalid = [
  {
    code: `
    test('test', () => {
        // setup
        // then
        // and
    });
    `,
    errors: [buildMessage(TestComments.SETUP, TestComments.THEN)],
  },
  {
    code: `
    it('test', () => {
        // setup
        // then
        // and
    });
    `,
    errors: [buildMessage(TestComments.SETUP, TestComments.THEN)],
  },
  {
    code: `
    it('test', () => {
        // given
        // then
        // and
    });
    `,
    errors: [buildMessage(TestComments.GIVEN, TestComments.THEN)],
  },
  {
    code: `
    it('test', () => {
        // and
        // then
        // and
    });
    `,
    errors: ['Test cannot start with AND.'],
  },
  {
    code: `
    it('test', () => {
        // then
        // when
    });
    `,
    errors: [buildMessage(TestComments.WHEN, TestComments.TEST_END)],
  },
  {
    code: `
    it('test', () => {
        // when
        // when
    });
    `,
    errors: [buildMessage(TestComments.WHEN, TestComments.WHEN)],
  },
  {
    code: `
    it('test', () => {
        // given
        // given
    });
    `,
    errors: [buildMessage(TestComments.GIVEN, TestComments.GIVEN)],
  },
  {
    code: `
    it('test', () => {
        // cleanup
        // then
        // and
        // then
        // and
    });
    `,
    errors: [buildMessage(TestComments.CLEANUP, TestComments.THEN)],
  },
  {
    code: `
    it.each\`
        var1 | var2
        val1 | val2
    \`('test', () => {
        // when
        const wrapper;
        // when
        expect(true);
    });
    `,
    errors: [buildMessage(TestComments.WHEN, TestComments.WHEN)],
  },
  {
    code: `
    it('test', () => {});
    `,
    errors: ['Test does not contain any BDD comments'],
  },
  {
    code: `
    it('test', () => {
      // notgiven
    });
    `,
    errors: ['Test does not contain any BDD comments'],
  },
];

describe('test-comments', () => {
  describe('should pass valid syntax', () => {
    ruleTester.run('src/rules/test-comments', rule, {
      valid: valid,
      invalid: [],
    });
  });

  describe('should pass invalid syntax', () => {
    ruleTester.run('lib/rules/test-comments', rule, {
      valid: [],
      invalid: invalid,
    });
  });
});
