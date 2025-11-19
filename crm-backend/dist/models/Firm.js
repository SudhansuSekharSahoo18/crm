"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const firmSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    gstNumber: {
        type: String,
        required: true,
        unique: true,
    },
    address: {
        type: String,
        required: false,
    },
    contactNumber: {
        type: String,
        required: false,
    },
    createdBy: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});
const Firm = (0, mongoose_1.model)('Firm', firmSchema);
exports.default = Firm;
