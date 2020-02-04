// This file is intended to contain functions / data that is shared
// between ui and server

export const getPasswordValidationConfig = function() {
    return {
        minLength: 8,
        maxLength: 128,
        maxRepeatableCharacters: 3,
        requireLowerCaseLetter: true,
        requireUpperCaseLetter: true,
        requireSpecialCharacter: true,
        requireNumber: true
    };
};
