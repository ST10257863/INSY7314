import Joi from 'joi';

// Email / password
export const registerSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string()
    .min(12)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/)
    .message('Password must include upper, lower, number, and symbol')
    .required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required()
});

// IBAN & BIC (SWIFT) regex whitelisting
const IBAN_REGEX = /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/; // simplified, server-side also normalizes
const BIC_REGEX  = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

export const paymentSchema = Joi.object({
  beneficiary_name: Joi.string().pattern(/^[A-Za-z \-'.]{2,120}$/).required(),
  beneficiary_iban: Joi.string().uppercase().replace(/\s+/g,'').pattern(IBAN_REGEX).required(),
  beneficiary_bic: Joi.string().uppercase().replace(/\s+/g,'').pattern(BIC_REGEX).required(),
  amount: Joi.number().precision(2).positive().max(1000000).required(),
  currency: Joi.string().uppercase().length(3).valid('USD','EUR','GBP','ZAR','AUD','CAD','JPY').required(),
  reference: Joi.string().max(140).allow('')
});
