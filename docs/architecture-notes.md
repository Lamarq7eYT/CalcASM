# CalcASM Architecture Notes

CalcASM is small enough to stay approachable, but the project still benefits
from a clear flow for parsing and evaluating calculator input.

## Flow

1. Read source text from the page or command entry point.
2. Normalize whitespace and line endings.
3. Tokenize numbers, operators, labels, and separators.
4. Validate token order before evaluation.
5. Evaluate the expression or instruction sequence.
6. Render either a result or a structured error message.

## Parser Responsibilities

- Reject unknown tokens early.
- Preserve the original token text for error messages.
- Keep numeric parsing separate from operation dispatch.
- Return stable error codes that can be tested.

## Evaluator Responsibilities

- Execute only validated operations.
- Keep arithmetic behavior deterministic.
- Report unsupported operations without crashing the UI.
- Keep examples in the README aligned with fixture tests.
