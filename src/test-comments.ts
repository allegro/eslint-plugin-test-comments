import { TSESTree } from '@typescript-eslint/experimental-utils/dist/ts-estree';
import { ESLintUtils } from '@typescript-eslint/experimental-utils';

export const getMessageId = (correctComments: TestComments[]): Messages => {
  if (correctComments.length === 0) return 'errorStartWithAnd';
  return 'errorWrongOrder';
};

export enum TestComments {
  AND = 'and',
  SETUP = 'setup',
  GIVEN = 'given',
  EXPECT = 'expect',
  WHEN = 'when',
  THEN = 'then',
  CLEANUP = 'cleanup',
  WHERE = 'where',
  TEST_END = 'test_end',
}

const allTestComments: TestComments[] = [
  TestComments.AND,
  TestComments.SETUP,
  TestComments.GIVEN,
  TestComments.EXPECT,
  TestComments.WHEN,
  TestComments.THEN,
  TestComments.CLEANUP,
  TestComments.TEST_END,
];

const isTestComment = (
  testComment: TestComments,
  comment?: TSESTree.Comment
) => {
  return comment?.value
    .toLowerCase()
    .trimStart()
    .startsWith(testComment.toLocaleString().toLowerCase());
};

const fromSourceCodeComment = (
  comment: TSESTree.Comment
): TestComments | undefined => {
  return allTestComments.find((testComment) =>
    isTestComment(testComment, comment)
  );
};

export const getSuccessors = (
  comment: TSESTree.Comment,
  allComments: TSESTree.Comment[] = []
): TestComments[] => {
  const testComment = fromSourceCodeComment(comment);

  if (!testComment) {
    return allTestComments;
  }

  // rules based on Spock framework rules https://github.com/spockframework/spock/blob/master/spock-core/src/main/java/org/spockframework/compiler/model/BlockParseInfo.java
  switch (testComment) {
    case TestComments.AND: {
      const commentIndex = allComments.findIndex((it) => it === comment);

      if (commentIndex === 0) return [];

      return getSuccessors(allComments[commentIndex - 1], allComments);
    }
    case TestComments.GIVEN:
    case TestComments.SETUP:
      return [
        TestComments.AND,
        TestComments.EXPECT,
        TestComments.WHEN,
        TestComments.CLEANUP,
        TestComments.WHERE,
        TestComments.TEST_END,
      ];
    case TestComments.WHEN:
      return [TestComments.AND, TestComments.THEN];
    case TestComments.EXPECT:
      return [
        TestComments.AND,
        TestComments.WHEN,
        TestComments.CLEANUP,
        TestComments.WHERE,
        TestComments.TEST_END,
      ];
    case TestComments.THEN:
      return [
        TestComments.AND,
        TestComments.EXPECT,
        TestComments.WHEN,
        TestComments.CLEANUP,
        TestComments.WHERE,
        TestComments.TEST_END,
        TestComments.THEN,
      ];
    case TestComments.CLEANUP:
      return [TestComments.AND, TestComments.WHERE, TestComments.TEST_END];
    default:
      return allTestComments;
  }
};

type Messages = 'errorWrongOrder' | 'errorStartWithAnd' | 'errorNoTestComments';
type Options = [
  {
    allowNoComments: boolean;
  }
];

const createRule = ESLintUtils.RuleCreator(() => '');
export const testCommentsRule = createRule<Options, Messages>({
  name: 'test-comments',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Proper order of given/when/then comments in test files',
      recommended: 'error',
    },
    messages: {
      errorWrongOrder:
        "'{{wrongType}}' is not allowed here; instead, use one of: [{{correctTypes}}]",
      errorStartWithAnd: 'Test cannot start with AND.',
      errorNoTestComments: 'Test does not contain any BDD comments',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          allowNoComments: { type: 'boolean' },
        },
      },
    ],
  },
  defaultOptions: [
    {
      allowNoComments: false,
    },
  ],
  create: (context, [options]) => {
    const checkCommentsOrder = (node: TSESTree.CallExpression) => {
      const comments = context
        .getSourceCode()
        .getCommentsInside(node)
        .filter(fromSourceCodeComment);

      if (!options.allowNoComments && comments.length === 0) {
        context.report({
          node,
          messageId: 'errorNoTestComments',
        });
      }

      comments.some((comment, index) => {
        const nextComment = comments[index + 1];
        const correctCommentSuccessors = getSuccessors(comment, comments);
        const nextTestComment =
          fromSourceCodeComment(nextComment) ?? TestComments.TEST_END;

        if (!correctCommentSuccessors.includes(nextTestComment)) {
          context.report({
            node:
              nextTestComment === TestComments.TEST_END ? comment : nextComment,
            messageId: getMessageId(correctCommentSuccessors),
            data: {
              wrongType: nextTestComment,
              correctTypes: correctCommentSuccessors.join(', '),
            },
          });

          return true;
        }
      });
    };

    return {
      'CallExpression[callee.name=/(^it$|^test$)/]': checkCommentsOrder, // basic 'it' and 'test' cases
      'CallExpression[callee.tag.object.name=/(^it$|^test$)/]':
        checkCommentsOrder, // 'it.each' and 'test.each'
    };
  },
});
