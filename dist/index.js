export var PropType;
(function (PropType) {
    PropType["UNDEFINED"] = "undefined";
    PropType["NULL"] = "null";
    PropType["BOOLEAN"] = "boolean";
    PropType["NUMBER"] = "number";
    PropType["STRING"] = "string";
    PropType["ARRAY"] = "array";
    PropType["OBJECT"] = "object";
})(PropType || (PropType = {}));
export class RuntimeValidator {
    /**
     * Get the type of a property, discerning JavaScript's generic "object" type
     * into its 3 possible variants: object, array or null
     * @param data The data to get the type of
     */
    static _getTypeOf = (data) => {
        const typeString = typeof data;
        return typeString === 'object'
            ? Array.isArray(data)
                ? 'array'
                : data === null
                    ? 'null'
                    : 'object'
            : typeString;
    };
    /**
     * Formats validation errors into a human-readable string
     * @param errors Array of validation errors to format
     * @returns A formatted string with all validation errors
     */
    static formatErrors(errors) {
        if (errors.length === 0) {
            return 'No validation errors';
        }
        const formatValue = (value) => {
            if (value === null)
                return 'null';
            if (value === undefined)
                return 'undefined';
            const strValue = String(value);
            // Handle object type descriptions
            if (strValue === '[object Object]') {
                return 'object';
            }
            // Handle array type descriptions
            if (strValue === '[object Array]') {
                return 'array';
            }
            // Handle union type descriptions
            if (typeof strValue === 'string' && strValue.startsWith('one of ')) {
                return strValue;
            }
            // Handle allowed values
            if (typeof strValue === 'string' && strValue.startsWith('one of [')) {
                return strValue;
            }
            return strValue;
        };
        return errors
            .map((error, index) => {
            const path = error.path ? `at "${error.path}"` : 'at root';
            const expected = formatValue(error.expected);
            const received = formatValue(error.received);
            return `${index + 1}. ${path}: ${error.message} (expected ${expected}, received ${received})`;
        })
            .join('\n');
    }
    /**
     * Normalizes a schema to its full form
     * @param schema The schema to normalize
     */
    static _normalizeSchema(schema) {
        // If schema is just a PropType, convert it to a BaseSchema
        if (typeof schema === 'string') {
            return { dataType: schema };
        }
        // If schema is an array literal (shorthand for array schema)
        if (Array.isArray(schema)) {
            // Handle array of union types
            if (schema.length > 1) {
                return {
                    dataType: PropType.ARRAY,
                    items: {
                        oneOf: schema.map((s) => this._normalizeSchema(s)),
                    },
                };
            }
            // Handle single type array
            const firstItem = schema[0];
            if (Array.isArray(firstItem)) {
                // Handle nested array shorthand
                return {
                    dataType: PropType.ARRAY,
                    items: this._normalizeSchema(firstItem),
                };
            }
            return {
                dataType: PropType.ARRAY,
                items: this._normalizeSchema(firstItem),
            };
        }
        // If schema is an object without dataType/properties, assume it's an object schema
        if (typeof schema === 'object' && !('dataType' in schema) && !('oneOf' in schema)) {
            const normalizedProperties = {};
            for (const [key, value] of Object.entries(schema)) {
                // Handle array shorthand in properties
                if (Array.isArray(value)) {
                    normalizedProperties[key] = {
                        dataType: PropType.ARRAY,
                        items: value.length === 1
                            ? this._normalizeSchema(value[0])
                            : {
                                oneOf: value.map((s) => this._normalizeSchema(s)),
                            },
                    };
                }
                else {
                    normalizedProperties[key] = this._normalizeSchema(value);
                }
            }
            return {
                dataType: PropType.OBJECT,
                properties: normalizedProperties,
                additionalProperties: false, // Default to strict mode
            };
        }
        // If schema is a union type, normalize each of its schemas
        if (typeof schema === 'object' && 'oneOf' in schema) {
            const unionSchema = schema;
            return {
                ...unionSchema,
                oneOf: unionSchema.oneOf.map((s) => this._normalizeSchema(s)),
            };
        }
        // If schema is an object schema, normalize its properties
        if (typeof schema === 'object' && 'properties' in schema) {
            const objSchema = schema;
            const normalizedProperties = {};
            for (const [key, value] of Object.entries(objSchema.properties)) {
                normalizedProperties[key] = this._normalizeSchema(value);
            }
            return {
                ...objSchema,
                properties: normalizedProperties,
            };
        }
        return schema;
    }
    /**
     * Validates data against a schema and returns an array of validation errors
     * @param data The data to validate
     * @param schema The schema to validate against
     * @param path The current path in the data structure (used for error reporting)
     */
    static validate(data, schema, path = '') {
        const normalizedSchema = this._normalizeSchema(schema);
        const errors = [];
        // Handle optional properties first
        if (data === undefined && normalizedSchema.optional) {
            return errors;
        }
        // Handle union types
        if ('oneOf' in normalizedSchema) {
            const unionSchema = normalizedSchema;
            // If the value is undefined and the schema is optional, return no errors
            if (data === undefined && unionSchema.optional) {
                return errors;
            }
            // If the value is undefined but the schema is not optional, return an error
            if (data === undefined) {
                errors.push({
                    path,
                    expected: `one of ${unionSchema.oneOf.length} possible types`,
                    received: 'undefined',
                    message: `Value does not match any of the allowed schemas`,
                });
                return errors;
            }
            const allErrors = [];
            let typeMatchFound = false;
            // Try validating against each possible schema
            for (const subSchema of unionSchema.oneOf) {
                const subErrors = this.validate(data, subSchema, path);
                if (subErrors.length === 0) {
                    // If any schema validates successfully, check allowedValues if specified
                    typeMatchFound = true;
                    if (unionSchema.allowedValues &&
                        !unionSchema.allowedValues.includes(data)) {
                        errors.push({
                            path,
                            expected: `one of [${unionSchema.allowedValues.join(', ')}]`,
                            received: String(data),
                            message: `Value ${data} is not in the allowed set of values`,
                        });
                    }
                    break;
                }
                allErrors.push(subErrors);
            }
            // If no type match was found, return the combined errors
            if (!typeMatchFound) {
                const combinedErrors = allErrors.flat();
                if (combinedErrors.length > 0) {
                    // For complex union types (objects), prefer property-level errors
                    const hasPropertyErrors = combinedErrors.some((error) => error.path !== path);
                    const hasTypeErrors = combinedErrors.some((error) => error.path === path);
                    if (hasPropertyErrors) {
                        // If we have property errors, only include those
                        errors.push(...combinedErrors.filter((error) => error.path !== path));
                    }
                    else if (hasTypeErrors) {
                        // If we only have type errors, use the generic union error
                        const type = this._getTypeOf(data);
                        errors.push({
                            path,
                            expected: `one of ${unionSchema.oneOf.length} possible types`,
                            received: type,
                            message: `Value does not match any of the allowed schemas`,
                        });
                    }
                }
            }
            return errors;
        }
        const type = this._getTypeOf(data);
        // Check if the type matches
        if (type !== normalizedSchema.dataType) {
            const expectedType = normalizedSchema.dataType === PropType.OBJECT ? 'object' : normalizedSchema.dataType;
            const receivedType = type === PropType.OBJECT ? 'object' : type;
            errors.push({
                path,
                expected: expectedType,
                received: receivedType,
                message: `Expected type ${expectedType} but received ${receivedType}`,
            });
            return errors;
        }
        // Check allowed values if specified
        if (normalizedSchema.allowedValues &&
            !normalizedSchema.allowedValues.includes(data)) {
            errors.push({
                path,
                expected: `one of [${normalizedSchema.allowedValues.join(', ')}]`,
                received: String(data),
                message: `Value ${data} is not in the allowed set of values`,
            });
        }
        // Handle object validation
        if (normalizedSchema.dataType === PropType.OBJECT && 'properties' in normalizedSchema) {
            const objSchema = normalizedSchema;
            // Check if data is an object
            if (type !== 'object' || data === null) {
                errors.push({
                    path,
                    expected: 'object',
                    received: type,
                    message: `Expected object but received ${type}`,
                });
                return errors;
            }
            const dataObj = data;
            // First validate each known property
            for (const [key, propSchema] of Object.entries(objSchema.properties)) {
                const propPath = path ? `${path}.${key}` : key;
                const propErrors = this.validate(dataObj[key], propSchema, propPath);
                errors.push(...propErrors);
            }
            // Then check for unexpected properties if additionalProperties is false (default) or explicitly set
            if (objSchema.additionalProperties !== true) {
                const unexpectedProps = Object.keys(dataObj).filter((key) => !(key in objSchema.properties));
                if (unexpectedProps.length > 0) {
                    for (const key of unexpectedProps) {
                        const propType = this._getTypeOf(dataObj[key]);
                        errors.push({
                            path: path ? `${path}.${key}` : key,
                            expected: 'undefined',
                            received: propType,
                            message: `Unexpected property "${key}"`,
                        });
                    }
                }
            }
        }
        // Handle array validation
        if (normalizedSchema.dataType === PropType.ARRAY && 'items' in normalizedSchema) {
            const arraySchema = normalizedSchema;
            // Check if data is an array
            if (!Array.isArray(data)) {
                errors.push({
                    path,
                    expected: 'array',
                    received: type,
                    message: `Expected array but received ${type}`,
                });
                return errors;
            }
            // Validate each array item
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const itemPath = `${path}[${i}]`;
                const itemErrors = this.validate(item, arraySchema.items, itemPath);
                if (itemErrors.length > 0) {
                    errors.push(...itemErrors);
                }
            }
        }
        return errors;
    }
}
