const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');

// Supprime les balises HTML et scripts pour prévenir les failles XSS stockées
function cleanText(text) {
  if (typeof text !== 'string') return text;
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
}

function sanitizeTaskInput(body) {
  if (!body || typeof body !== 'object') return {};

  const cleaned = { ...body };
  if (typeof cleaned.title === 'string') {
    cleaned.title = cleanText(cleaned.title);
  }
  if (typeof cleaned.description === 'string') {
    cleaned.description = cleanText(cleaned.description);
  }
  return cleaned;
}

const registerSchema = Joi.object({
  username: Joi.string().trim().alphanum().min(3).max(30).required().messages({
    'string.base': "Le nom d'utilisateur doit être une chaîne de caractères.",
    'string.alphanum': "Le nom d'utilisateur ne doit contenir que des lettres et des chiffres.",
    'string.min': "Le nom d'utilisateur doit contenir au moins 3 caractères.",
    'string.max': "Le nom d'utilisateur ne doit pas dépasser 30 caractères.",
    'any.required': "Le nom d'utilisateur est obligatoire.",
    'string.empty': "Le nom d'utilisateur est obligatoire.",
  }),
  password: Joi.string().min(8).max(72).required().messages({
    'string.base': 'Le mot de passe doit être une chaîne de caractères.',
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères.',
    'string.max': 'Le mot de passe ne doit pas dépasser 72 caractères.',
    'any.required': 'Le mot de passe est obligatoire.',
    'string.empty': 'Le mot de passe est obligatoire.',
  }),
});

const loginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    'string.base': "Le nom d'utilisateur doit être une chaîne de caractères.",
    'any.required': "Le nom d'utilisateur est obligatoire.",
    'string.empty': "Le nom d'utilisateur est obligatoire.",
  }),
  password: Joi.string().required().messages({
    'string.base': 'Le mot de passe doit être une chaîne de caractères.',
    'any.required': 'Le mot de passe est obligatoire.',
    'string.empty': 'Le mot de passe est obligatoire.',
  }),
});

const createTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).required().messages({
    'string.base': 'Le titre doit être une chaîne de caractères.',
    'string.empty': 'Le titre est obligatoire.',
    'string.max': 'Le titre ne doit pas dépasser 120 caractères.',
    'any.required': 'Le titre est obligatoire.',
  }),
  description: Joi.string().trim().max(1000).allow('').optional().messages({
    'string.base': 'La description doit être une chaîne de caractères.',
    'string.max': 'La description ne doit pas dépasser 1000 caractères.',
  }),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(120).messages({
    'string.base': 'Le titre doit être une chaîne de caractères.',
    'string.empty': 'Le titre ne peut pas être vide.',
    'string.max': 'Le titre ne doit pas dépasser 120 caractères.',
  }),
  description: Joi.string().trim().max(1000).allow('').messages({
    'string.base': 'La description doit être une chaîne de caractères.',
    'string.max': 'La description ne doit pas dépasser 1000 caractères.',
  }),
  isCompleted: Joi.boolean().messages({
    'boolean.base': 'Le statut isCompleted doit être un booléen.',
  }),
})
  .min(1)
  .messages({
    'object.min': 'Au moins un champ à modifier doit être fourni.',
  });

module.exports = {
  cleanText,
  sanitizeTaskInput,
  registerSchema,
  loginSchema,
  createTaskSchema,
  updateTaskSchema,
};
