"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterUserCommand = void 0;
class RegisterUserCommand {
    email;
    password;
    firstName;
    lastName;
    phone;
    address;
    city;
    postalCode;
    country;
    dateOfBirth;
    constructor(email, password, firstName, lastName, phone, address, city, postalCode, country, dateOfBirth) {
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.address = address;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
        this.dateOfBirth = dateOfBirth;
    }
}
exports.RegisterUserCommand = RegisterUserCommand;
//# sourceMappingURL=register-user.command.js.map