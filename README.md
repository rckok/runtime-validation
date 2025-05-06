# Runtime Validation

A lightweight runtime validation library for JavaScript data structures using TypeScript-like schemas.

## Features

- Runtime type checking
- TypeScript-like schema definitions
- Union types
- Optional properties
- Restriction of allowed values
- Strict object validation (no additional properties allowed by default)
- Shorthand notation for simpler schemas
- Support for nested objects and arrays
- Detailed error messages with paths to indicate precisely where validation failed

## Installation

```bash
npm install runtime-validation
```

## Usage

```typescript
import { RuntimeValidator, PropType, Schema } from 'runtime-validation';

// Define a schema using shorthand notation
const userSchema: Schema = {
  name: PropType.STRING,
  age: PropType.NUMBER,
  email: { dataType: PropType.STRING, optional: true },
  status: {
    dataType: PropType.STRING,
    allowedValues: ['active', 'inactive'],
  },
  tags: [PropType.STRING], // Array shorthand
  matrix: [
    // Nested array with union types
    [
      {
        oneOf: [PropType.STRING, PropType.NUMBER],
      },
    ],
  ],
};

// Same schema using full notation
const userSchemaFull: Schema = {
  dataType: PropType.OBJECT,
  properties: {
    name: { dataType: PropType.STRING },
    age: { dataType: PropType.NUMBER },
    email: { dataType: PropType.STRING, optional: true },
    status: {
      dataType: PropType.STRING,
      allowedValues: ['active', 'inactive'],
    },
    tags: {
      dataType: PropType.ARRAY,
      items: { dataType: PropType.STRING },
    },
    matrix: {
      dataType: PropType.ARRAY,
      items: {
        dataType: PropType.ARRAY,
        items: {
          oneOf: [PropType.STRING, PropType.NUMBER],
        },
      },
    },
  },
};

// Validate data
const data = {
  name: 'John Doe',
  age: 30,
  status: 'active',
  tags: ['user', 'admin'],
  matrix: [
    ['hello', 123],
    ['world', 456],
  ],
};

const errors = RuntimeValidator.validate(data, userSchema);
if (errors.length === 0) {
  console.log('Data is valid!');
} else {
  // Convert errors to a human readable format when logging them
  console.log('Validation errors:', RuntimeValidator.formatErrors(errors));
}
```

## Schema Notation

The library supports two ways of defining schemas: shorthand and full notation. Shorthand notation is more concise and easier to read for simple cases, while full notation provides more explicit control and is required for complex scenarios.

### When to Use Shorthand Notation

Use shorthand notation when:

- Defining simple object schemas
- Working with basic type validations
- Creating array schemas with a single item type
- You want more concise and readable code
- Working with nested arrays and union types

### When to Use Full Notation

Use full notation when:

- You need to specify additional properties behavior
- Working with complex nested structures
- You need to add metadata to your schema (e.g. `optional`, `allowedValues`, `oneOf` or `allowedValues`)
- You want to be explicit about all schema properties

### Basic Types

The library supports the following basic types:

- `PropType.STRING`
- `PropType.NUMBER`
- `PropType.BOOLEAN`
- `PropType.NULL`
- `PropType.OBJECT`
- `PropType.ARRAY`

### Object Shorthand

You can define object schemas using shorthand notation:

```typescript
const schema: Schema = {
  name: PropType.STRING,
  age: PropType.NUMBER,
  isActive: PropType.BOOLEAN,
  tags: [PropType.NUMBER],
};
```

This is equivalent to the full notation:

```typescript
const schema: Schema = {
  dataType: PropType.OBJECT,
  properties: {
    name: { dataType: PropType.STRING },
    age: { dataType: PropType.NUMBER },
    isActive: { dataType: PropType.BOOLEAN },
    tags: {
      dataType: PropType.ARRAY,
      items: PropType.NUMBER,
    },
  },
};
```

Note: to avoid conflicts with the schema's type definition, do not use shorthand notation when an object contains any of the following reserved keywords as a property name:

- `dataType`
- `properties`
- `items`
- `oneOf`
- `optional`
- `allowedValues`

In such cases, these properties can be specified using the full object notation, e.g.:

```typescript
{
  dataType: PropType.OBJECT,
  properties: {
    dataType: STRING,
    (...)
  }
}
```

### Array Shorthand

You can define array schemas using shorthand notation:

```typescript
const schema: Schema = {
  tags: [PropType.STRING],
};
```

This is equivalent to the full notation:

```typescript
const schema: Schema = {
  dataType: PropType.OBJECT,
  properties: {
    tags: {
      dataType: PropType.ARRAY,
      items: { dataType: PropType.STRING },
    },
  },
};
```

Note: Shorthand notation only works for simple types and union types. For complex schemas (like objects or nested arrays), you must use the full notation.

### Union Types

You can define union types using the `oneOf` property. For example, to specify an object with an `id` property that can be either a string or a number, write:

```typescript
const schema: Schema = {
  dataType: PropType.OBJECT,
  properties: {
    id: {
      oneOf: [PropType.STRING, PropType.NUMBER],
    },
  },
};
```

### Allowed Values

You can restrict values to a specific set using the `allowedValues` property:

```typescript
const schema: Schema = {
  dataType: PropType.OBJECT,
  properties: {
    status: {
      dataType: PropType.STRING,
      allowedValues: ['active', 'inactive', 'pending'],
    },
  },
};
```

### Allowed Values with Union Types

When using `allowedValues` with union types, you can mix different data types in the allowed values list. This is particularly useful when you want to allow both string and number values for the same property:

```typescript
const schema: Schema = {
  dataType: PropType.OBJECT,
  properties: {
    status: {
      optional: true,
      oneOf: [PropType.STRING, PropType.NUMBER],
      allowedValues: ['active', 'inactive', 0, 1],
    },
  },
};
```

This schema will:

- Allow the property to be omitted (optional)
- When present, accept either a string or number
- Only allow the specific values: 'active', 'inactive', 0, or 1

Example valid data:

```typescript
const validData1 = { status: 'active' };
const validData2 = { status: 1 };
const validData3 = {}; // status is optional
```

Example invalid data:

```typescript
const invalidData1 = { status: 'pending' }; // not in allowedValues
const invalidData2 = { status: true }; // wrong type
const invalidData3 = { status: 2 }; // not in allowedValues
```

### Optional Properties

You can mark properties as optional using the `optional` property:

```typescript
const schema: Schema = {
  dataType: PropType.OBJECT,
  properties: {
    name: { dataType: PropType.STRING, optional: true },
    age: PropType.NUMBER,
  },
};
```

### Additional Properties

By default, objects are strict and don't allow additional properties outside of those specified in the schema. You can allow additional properties by setting `additionalProperties` to `true`:

```typescript
const schema: Schema = {
  dataType: PropType.OBJECT,
  properties: {
    name: PropType.STRING,
    age: PropType.NUMBER,
  },
  additionalProperties: true,
};
```

## Error Format

Validation will return a list of zero or more errors, each of which includes:

- `path`: The path to the invalid property
- `expected`: The expected type or value
- `received`: The actual type or value received
- `message`: A human-readable error message

Example:

```typescript
{
  path: "user.age",
  expected: "number",
  received: "string",
  message: "Expected type number but received string"
}
```

When logging these errors, they can be converted to a human readable format using `RuntimeValidator.validateErrors()`, e.g.:

```typescript
const errors = RuntimeValidator.validate(data, schema);
if (errors.length) {
  const formatted = RuntimeValidator.formatErrors(errors);
  console.log(`Validation errors: ${formatted}`);
}
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build the package
npm run build

# Lint the code
npm run lint

# Format the code
npm run format
```

## License

MIT
