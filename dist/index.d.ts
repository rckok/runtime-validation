export declare enum PropType {
    UNDEFINED = "undefined",
    NULL = "null",
    BOOLEAN = "boolean",
    NUMBER = "number",
    STRING = "string",
    ARRAY = "array",
    OBJECT = "object"
}
export interface ValidationError {
    path: string;
    expected: string;
    received: string;
    message: string;
}
type PrimitiveValue = string | number | boolean | null | undefined;
type JsonValue = PrimitiveValue | JsonValue[] | {
    [key: string]: JsonValue;
};
export interface BaseSchema {
    dataType: PropType;
    optional?: boolean;
    allowedValues?: PrimitiveValue[];
}
export interface ObjectSchema extends BaseSchema {
    dataType: PropType.OBJECT;
    properties: Record<string, Schema>;
    additionalProperties?: boolean;
}
interface ArraySchema extends BaseSchema {
    dataType: PropType.ARRAY;
    items: Schema;
}
interface UnionSchema {
    oneOf: Schema[];
    optional?: boolean;
    allowedValues?: PrimitiveValue[];
}
type SchemaValue = PropType | BaseSchema | ObjectSchema | ArraySchema | UnionSchema;
type SchemaArray = SchemaValue | SchemaValue[] | {
    oneOf: SchemaValue[];
}[];
type SchemaObject = {
    [key: string]: SchemaValue | SchemaArray | SchemaObject;
};
type NestedSchema = PropType | {
    oneOf: PropType[];
} | {
    [key: string]: NestedSchema;
} | NestedSchema[];
type SchemaLiteral = {
    [key: string]: NestedSchema;
};
export type Schema = SchemaValue | PropType[] | SchemaValue[] | SchemaObject | SchemaLiteral;
export declare class RuntimeValidator {
    /**
     * Get the type of a property, discerning JavaScript's generic "object" type
     * into its 3 possible variants: object, array or null
     * @param data The data to get the type of
     */
    private static _getTypeOf;
    /**
     * Formats validation errors into a human-readable string
     * @param errors Array of validation errors to format
     * @returns A formatted string with all validation errors
     */
    static formatErrors(errors: ValidationError[]): string;
    /**
     * Normalizes a schema to its full form
     * @param schema The schema to normalize
     */
    private static _normalizeSchema;
    /**
     * Validates data against a schema and returns an array of validation errors
     * @param data The data to validate
     * @param schema The schema to validate against
     * @param path The current path in the data structure (used for error reporting)
     */
    static validate(data: JsonValue, schema: Schema, path?: string): ValidationError[];
}
export {};
