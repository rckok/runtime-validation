import { RuntimeValidator, PropType, Schema } from './index';
import '@jest/globals';

describe('RuntimeValidator', () => {
  describe('Basic type validation', () => {
    test('validates string type', () => {
      const schema: Schema = { dataType: PropType.STRING };
      expect(RuntimeValidator.validate('hello', schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(123, schema)).toHaveLength(1);
    });

    test('validates number type', () => {
      const schema: Schema = { dataType: PropType.NUMBER };
      expect(RuntimeValidator.validate(123, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate('123', schema)).toHaveLength(1);
    });

    test('validates boolean type', () => {
      const schema: Schema = { dataType: PropType.BOOLEAN };
      expect(RuntimeValidator.validate(true, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate('true', schema)).toHaveLength(1);
    });

    test('validates null type', () => {
      const schema: Schema = { dataType: PropType.NULL };
      expect(RuntimeValidator.validate(null, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(undefined, schema)).toHaveLength(1);
    });
  });

  describe('Shorthand notation', () => {
    test('validates using shorthand type notation', () => {
      const schema: Schema = {
        name: PropType.STRING,
        age: PropType.NUMBER,
        isActive: PropType.BOOLEAN,
      };

      const validData = {
        name: 'John',
        age: 30,
        isActive: true,
      };

      const invalidData = {
        name: 123,
        age: '30',
        isActive: 'true',
      };

      expect(RuntimeValidator.validate(validData, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(3);
    });

    test('validates using shorthand array notation', () => {
      const schema: Schema = {
        tags: [PropType.STRING],
      };

      const validData = {
        tags: ['tag1', 'tag2'],
      };

      const invalidData = {
        tags: ['tag1', 123],
      };

      const backupsSchema: Schema = {
        backups: [
          {
            createdDate: PropType.STRING,
            fileURL: PropType.STRING,
          },
        ],
      };

      const validBackupData = {
        backups: [
          {
            createdDate: '2024-03-14',
            fileURL: 'https://example.com/backup1.zip',
          },
          {
            createdDate: '2024-03-15',
            fileURL: 'https://example.com/backup2.zip',
          },
        ],
      };

      const invalidBackupData = {
        backups: [
          {
            createdDate: 123, // Should be string
            fileURL: 'https://example.com/backup1.zip',
          },
          {
            createdDate: '2024-03-15',
            fileURL: 456, // Should be string
          },
        ],
      };

      expect(RuntimeValidator.validate(validData, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(1);
      expect(RuntimeValidator.validate(validBackupData, backupsSchema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidBackupData, backupsSchema)).toHaveLength(2);
    });
  });

  describe('Optional properties', () => {
    test('validates optional properties', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          name: { dataType: PropType.STRING, optional: true },
          age: PropType.NUMBER,
        },
      };

      const validData1 = {
        name: 'John',
        age: 30,
      };

      const validData2 = {
        age: 30,
      };

      const invalidData = {
        name: 123,
        age: 30,
      };

      expect(RuntimeValidator.validate(validData1, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData2, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(1);
    });

    test('validates optional properties with union types', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          id: {
            optional: true,
            oneOf: [PropType.STRING, PropType.NUMBER],
          },
          name: PropType.STRING,
        },
      };

      const validData1 = {
        id: '123',
        name: 'John',
      };

      const validData2 = {
        id: 123,
        name: 'John',
      };

      const validData3 = {
        name: 'John',
      };

      const invalidData1 = {
        id: true,
        name: 'John',
      };

      const invalidData2 = {
        id: null,
        name: 'John',
      };

      expect(RuntimeValidator.validate(validData1, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData2, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData3, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData1, schema)).toHaveLength(1);
      expect(RuntimeValidator.validate(invalidData2, schema)).toHaveLength(1);
    });
  });

  describe('Allowed values', () => {
    test('validates allowed values', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          status: {
            dataType: PropType.STRING,
            allowedValues: ['active', 'inactive', 'pending'],
          },
        },
      };

      const validData = {
        status: 'active',
      };

      const invalidData = {
        status: 'unknown',
      };

      expect(RuntimeValidator.validate(validData, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(1);
    });
  });

  describe('Union types', () => {
    test('validates union types', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          id: {
            oneOf: [PropType.STRING, PropType.NUMBER],
          },
        },
      };

      const validData1 = { id: '123' };
      const validData2 = { id: 123 };
      const invalidData = { id: true };

      expect(RuntimeValidator.validate(validData1, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData2, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(1);
    });

    test('validates complex union types', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          value: {
            oneOf: [
              PropType.STRING,
              {
                dataType: PropType.OBJECT,
                properties: {
                  type: PropType.STRING,
                  data: PropType.NUMBER,
                },
              },
            ],
          },
        },
      };

      const validData1 = { value: 'string' };
      const validData2 = { value: { type: 'number', data: 123 } };
      const invalidData = { value: { type: 'number', data: '123' } };

      expect(RuntimeValidator.validate(validData1, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData2, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(1);
    });
  });

  describe('Additional properties', () => {
    test('validates strict objects (no additional properties)', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          name: PropType.STRING,
          age: PropType.NUMBER,
        },
      };

      const validData = {
        name: 'John',
        age: 30,
      };

      const invalidData = {
        name: 'John',
        age: 30,
        email: 'john@example.com',
      };

      expect(RuntimeValidator.validate(validData, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(1);
    });

    test('validates flexible objects (allowing additional properties)', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          name: PropType.STRING,
          age: PropType.NUMBER,
        },
        additionalProperties: true,
      };

      const validData = {
        name: 'John',
        age: 30,
        email: 'john@example.com',
      };

      expect(RuntimeValidator.validate(validData, schema)).toHaveLength(0);
    });
  });

  describe('Nested objects', () => {
    test('validates nested objects', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          user: {
            dataType: PropType.OBJECT,
            properties: {
              name: PropType.STRING,
              age: PropType.NUMBER,
            },
          },
        },
      };

      const validData = {
        user: {
          name: 'John',
          age: 30,
        },
      };

      const invalidData = {
        user: {
          name: 123,
          age: '30',
        },
      };

      expect(RuntimeValidator.validate(validData, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(2);
    });
  });

  describe('Nested arrays', () => {
    test('validates nested arrays', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          matrix: {
            dataType: PropType.ARRAY,
            items: {
              dataType: PropType.ARRAY,
              items: PropType.NUMBER,
            },
          },
        },
      };

      const validData = {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      };

      const invalidData = {
        matrix: [
          [1, '2', 3],
          [4, 5, '6'],
        ],
      };

      expect(RuntimeValidator.validate(validData, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(2);
    });
  });

  describe('Error messages', () => {
    test('provides detailed error messages', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          name: PropType.STRING,
          age: PropType.NUMBER,
          email: {
            dataType: PropType.STRING,
            optional: true,
          },
          status: {
            dataType: PropType.STRING,
            allowedValues: ['active', 'inactive'],
          },
        },
      };

      const data = {
        name: 123,
        age: '30',
        email: 456,
        status: 'unknown',
      };

      const errors = RuntimeValidator.validate(data, schema);
      expect(errors).toHaveLength(4);
      expect(errors[0].path).toBe('name');
      expect(errors[0].message).toContain('Expected type string but received number');
      expect(errors[1].path).toBe('age');
      expect(errors[1].message).toContain('Expected type number but received string');
      expect(errors[2].path).toBe('email');
      expect(errors[2].message).toContain('Expected type string but received number');
      expect(errors[3].path).toBe('status');
      expect(errors[3].message).toContain('Value unknown is not in the allowed set of values');
    });
  });

  describe('Real life scenario', () => {
    test('validates a complex user object', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          id: PropType.STRING,
          name: PropType.STRING,
          email: {
            dataType: PropType.STRING,
            optional: true,
          },
          age: PropType.NUMBER,
          isActive: PropType.BOOLEAN,
          roles: [PropType.STRING],
          settings: {
            dataType: PropType.OBJECT,
            properties: {
              theme: {
                dataType: PropType.STRING,
                allowedValues: ['light', 'dark'],
              },
              notifications: PropType.BOOLEAN,
            },
          },
        },
      };

      const validData = {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        isActive: true,
        roles: ['user', 'admin'],
        settings: {
          theme: 'dark',
          notifications: true,
        },
      };

      const invalidData = {
        id: 123,
        name: 'John Doe',
        email: 456,
        age: '30',
        isActive: 'true',
        roles: ['user', 123],
        settings: {
          theme: 'unknown',
          notifications: 'true',
        },
      };

      expect(RuntimeValidator.validate(validData, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(7);
    });
  });

  describe('Schema normalization', () => {
    test('preserves all properties when normalizing union types', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          id: {
            optional: true,
            oneOf: [PropType.STRING, PropType.NUMBER],
            allowedValues: ['123', '456', 789],
          },
          name: PropType.STRING,
        },
      };

      const validData1 = {
        id: '123',
        name: 'John',
      };

      const validData2 = {
        id: 789,
        name: 'John',
      };

      const validData3 = {
        name: 'John',
      };

      const invalidData1 = {
        id: '999', // Not in allowedValues
        name: 'John',
      };

      const invalidData2 = {
        id: true, // Wrong type
        name: 'John',
      };

      expect(RuntimeValidator.validate(validData1, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData2, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData3, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData1, schema)).toHaveLength(1);
      expect(RuntimeValidator.validate(invalidData2, schema)).toHaveLength(1);
    });

    test('enforces allowedValues for union types', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          status: {
            optional: true,
            oneOf: [PropType.STRING, PropType.NUMBER],
            allowedValues: ['active', 'inactive', 0, 1],
          },
          type: {
            optional: true,
            oneOf: [PropType.STRING, PropType.NUMBER],
            allowedValues: ['user', 'admin', 1, 2],
          },
        },
      };

      const validData1 = {
        status: 'active',
        type: 'user',
      };

      const validData2 = {
        status: 1,
        type: 2,
      };

      const validData3 = {
        status: 'active',
      };

      const invalidData1 = {
        status: 'pending', // Not in allowedValues
        type: 'user',
      };

      const invalidData2 = {
        status: 'active',
        type: 'superuser', // Not in allowedValues
      };

      const invalidData3 = {
        status: true, // Wrong type
        type: 'user',
      };

      expect(RuntimeValidator.validate(validData1, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData2, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData3, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData1, schema)).toHaveLength(1);
      expect(RuntimeValidator.validate(invalidData2, schema)).toHaveLength(1);
      expect(RuntimeValidator.validate(invalidData3, schema)).toHaveLength(1);
    });

    test('preserves nested schema properties', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          user: {
            dataType: PropType.OBJECT,
            properties: {
              id: {
                optional: true,
                oneOf: [PropType.STRING, PropType.NUMBER],
                allowedValues: ['123', '456', 789],
              },
              name: PropType.STRING,
            },
          },
        },
      };

      const validData1 = {
        user: {
          id: '123',
          name: 'John',
        },
      };

      const validData2 = {
        user: {
          name: 'John',
        },
      };

      const invalidData = {
        user: {
          id: '999', // Not in allowedValues
          name: 'John',
        },
      };

      expect(RuntimeValidator.validate(validData1, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData2, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(1);
    });

    test('preserves array schema properties', () => {
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: {
          items: {
            dataType: PropType.ARRAY,
            items: {
              optional: true,
              oneOf: [PropType.STRING, PropType.NUMBER],
              allowedValues: ['123', '456', 789],
            },
          },
        },
      };

      const validData1 = {
        items: ['123', 789],
      };

      const validData2 = {
        items: ['123', undefined, 789],
      };

      const invalidData = {
        items: ['123', '999', 789], // '999' not in allowedValues
      };

      expect(RuntimeValidator.validate(validData1, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validData2, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalidData, schema)).toHaveLength(1);
    });
  });

  describe('Real world scenario', () => {
    test('validate a complex object', () => {
      const { ARRAY, BOOLEAN, STRING, NULL, NUMBER } = PropType;

      const data = {
        name: 'MyInsertedCourt',
        backgroundId: '16',
        linesId: null,
        logos: [],
        size: 'Full',
        usage: 'Professional',
        tags: [],
        type: null,
        league: null,
        index: -1,
        category: 'play',
        phases: [
          {
            id: 'testPhase1',
            logos: [
              {
                y: 0.05144290348387326,
                x: 0.0266,
                logoId: '332',
                width: 0.01765961484998182,
                aspectRatio: 0.4407839866555463,
                effects: [],
                rotation: -90,
                id: 'abc',
                isEditable: true,
              },
              {
                aspectRatio: 2.9403973509933774,
                width: 0.13744889144831557,
                id: '123',
                effects: [
                  {
                    type: 'color',
                    color: '#0a2140',
                  },
                ],
                logoId: '329',
                y: 0.8048,
                isEditable: true,
                rotation: 90,
                x: 0.9734,
              },
            ],
          },
        ],
        recordings: [],
      };

      const CourtLogoSchema = {
        id: STRING,
        logoId: STRING,
        x: NUMBER,
        y: NUMBER,
        width: NUMBER,
        aspectRatio: NUMBER,
        rotation: NUMBER,
        effects: [
          {
            oneOf: [
              {
                type: {
                  dataType: STRING,
                  allowedValues: ['color'],
                },
                color: STRING,
                blendMode: {
                  optional: true,
                  dataType: STRING,
                  allowedValues: ['normal', 'multiply'],
                },
              },
              {
                type: {
                  dataType: STRING,
                  allowedValues: ['opacity'],
                },
                opacity: NUMBER,
              },
            ],
          },
        ],
        isEditable: BOOLEAN,
      };

      const schema = {
        name: STRING,
        index: {
          optional: true,
          dataType: NUMBER,
        },
        type: {
          oneOf: [STRING, NULL],
          optional: true,
        },
        category: {
          dataType: STRING,
          allowedValues: ['regular', 'play', 'fitness', 'presentation'],
        },
        backgroundId: STRING,
        linesId: {
          oneOf: [STRING, NULL],
          optional: true,
        },
        logos: {
          dataType: ARRAY,
          items: CourtLogoSchema,
        },
        size: STRING,
        usage: STRING,
        league: {
          oneOf: [STRING, NULL],
          optional: true,
        },
        tags: [STRING],
        phases: {
          dataType: ARRAY,
          items: {
            id: STRING,
            logos: {
              dataType: ARRAY,
              items: CourtLogoSchema,
            },
          },
        },
        recordings: {
          dataType: ARRAY,
          items: [
            {
              id: STRING,
              name: STRING,
            },
          ],
        },
      };

      const errors = RuntimeValidator.validate(data, schema);
      console.log(errors);
      expect(errors.length).toBe(0);
    });
  });

  describe('Global strict mode', () => {
    afterEach(() => {
      // Reset to default after each test
      RuntimeValidator.strict = true;
    });

    test('strict=true (default): additional properties are not allowed', () => {
      RuntimeValidator.strict = true;
      const schema: Schema = {
        foo: PropType.STRING,
      };
      const valid = { foo: 'bar' };
      const invalid = { foo: 'bar', extra: 123 };
      expect(RuntimeValidator.validate(valid, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalid, schema)).toHaveLength(1);
      expect(RuntimeValidator.validate(invalid, schema)[0].message).toMatch(/Unexpected property/);
    });

    test('strict=false: additional properties are allowed by default', () => {
      RuntimeValidator.strict = false;
      const schema: Schema = {
        foo: PropType.STRING,
      };
      const valid = { foo: 'bar' };
      const validWithExtra = { foo: 'bar', extra: 123 };
      expect(RuntimeValidator.validate(valid, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(validWithExtra, schema)).toHaveLength(0);
    });

    test('per-schema additionalProperties overrides global strict', () => {
      RuntimeValidator.strict = false;
      const schema: Schema = {
        dataType: PropType.OBJECT,
        properties: { foo: PropType.STRING },
        additionalProperties: false,
      };
      const valid = { foo: 'bar' };
      const invalid = { foo: 'bar', extra: 123 };
      expect(RuntimeValidator.validate(valid, schema)).toHaveLength(0);
      expect(RuntimeValidator.validate(invalid, schema)).toHaveLength(1);
      expect(RuntimeValidator.validate(invalid, schema)[0].message).toMatch(/Unexpected property/);
    });
  });
});
