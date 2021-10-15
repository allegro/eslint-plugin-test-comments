# eslint-plugin-test-comments

Enforces BDD style comments in your JavaScript tests! (given/when/then). Rule is inspired by [Spock framework](https://spockframework.org/).

## Options

This rule accepts one boolean option:

`allowNoComments`: does not report any errors when there are no BDD comments in a test, defaults with `false`.

For example:

```jsonc
{
  "test-comments/test-comments": ["error", {
    allowNoComments: true
  }]
}
```

## Rule Details

Examples of **incorrect** code.

```ts
it('test', () => {
  // given
  // and
  // given 
});
```

```ts
it('test', () => {
  // and
  // given 
  // when 
});
```

```ts
it('test', () => {});
```

Examples of **correct** code

```ts
it('test', () => {
  // given
  // and
  // when
  // then
});
```

```ts
it('test', () => {
  // given something
  // and something else
  // when something occurs
  // then something should work
  // some other comment
});
```

Examples of **correct** code with `allowNoComments` option.
```ts
it('test', () => {});
```

## When Not To Use It

If you don't want to use BDD conventions in your tests