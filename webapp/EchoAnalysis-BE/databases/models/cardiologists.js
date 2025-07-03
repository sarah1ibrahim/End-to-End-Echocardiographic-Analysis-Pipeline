import { Sequelize,DataTypes } from 'sequelize';
import { connection } from '../dbConnection.js';
import Joi from 'joi';
const cardiologistSchema =connection.define('cardiologists',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email:{
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true,
        validate: {
            isEmail: true // Validation rule: the value must be a valid email format
        },
        set(value) {
            this.setDataValue('email', value.trim().toLowerCase());
        }

    },
    password: {
        type: DataTypes.STRING(250),
        allowNull: false,
        validate: {
            notEmpty: true,
            len: {
                args: [6, 100],
                msg: "Password must be between 6 and 100 characters long"
            }
        }
    },
    first_name: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    last_name:{
        type: DataTypes.STRING(200),
        allowNull: false
    },
    Bdate: {
        type: DataTypes.DATEONLY,
    },
    sex: {
        
        type:DataTypes.ENUM('male','female'),
        allowNull: false,
    },
    
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
        // unique: true
    },
    Specialization: {
        type: DataTypes.STRING,
        allowNull: false,
    
    },
    status:{
        type: DataTypes.ENUM('active','inactive','pending'),
        defaultValue: 'active'  
    }
    
})


connection.sync()
    .then(() =>{
        console.log("table created succecssfully ")
    })
    .catch((err)=>{
        console.log("can not syncing database",err)
    })

const cardiologistValidationSchema = (patientData)=>{
    const schema = Joi.object({
        email: Joi.string()
            .email({ tlds: { allow: false } }) // Validates email format, no TLD restriction
            .max(255).required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'string.max': 'Email must not exceed 255 characters',
                'any.required': 'Email is required'
            }),
        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.max': 'Password must not exceed 128 characters',
                'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)',
                'any.required': 'Password is required'
            }),
        fname: Joi.string()
            .min(2)
            .max(200)
            .required()
            .messages({
                'string.min': 'First name must be at least 2 characters',
                'string.max': 'First name must not exceed 200 characters',
                'any.required': 'First name is required'
            }),
        lname: Joi.string()
            .min(2)
            .max(200)
            .required()
            .messages({
                'string.min': 'Last name must be at least 2 characters',
                'string.max': 'Last name must not exceed 200 characters',
                'any.required': 'Last name is required'
            }),
        Bdate: Joi.date()
            .max('now') // No future dates
            .required()
            .messages({
                'date.max': 'Birth date cannot be in the future',
                'any.required': 'Birth date is required'
            }),
        sex: Joi.string()
            .valid('male', 'female')
            .required()
            .messages({
                'any.only': 'Sex must be either "male" or "female"',
                'any.required': 'Sex is required'
            }),
        phone: Joi.string()
            .min(10)
            .max(15)
            .pattern(/^[0-9]+$/)
            .required()
            .messages({
                'string.min': 'Phone number must be at least 10 digits',
                'string.max': 'Phone number must not exceed 15 digits',
                'string.pattern.base': 'Phone number must contain only digits',
                'any.required': 'Phone number is required'
            }),
        specialization: Joi.string()
            .max(200)
            .required()
            .messages({
                'string.max': 'Specialization must not exceed 200 characters',
                'any.required': 'Specialization is required'
            }),
        status: Joi.string()
            .valid('active', 'inactive', 'pending')
            .messages({
                'any.only': 'Status must be "active", "inactive", or "pending"',
                'any.required': 'Status is required'
            })
    });
    return schema.validate(patientData,{ abortEarly: false });
    //{abortEarly: false}  to validate all of them then return list of problem not validtae only one 
    

}

const cardiologistUpdateSchema = (patientData)=>{
    const schema = Joi.object({
        email: Joi.string()
            .email({ tlds: { allow: false } }) // Validates email format, no TLD restriction
            .max(255).optional()
            .messages({
                'string.email': 'Please provide a valid email address',
                'string.max': 'Email must not exceed 255 characters',
            }),
        password: Joi.string()
            .min(8)
            .max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)
            .optional()
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.max': 'Password must not exceed 128 characters',
                'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)',
            }),
        fname: Joi.string()
            .min(2)
            .max(200)
            .optional()
            .messages({
                'string.min': 'First name must be at least 2 characters',
                'string.max': 'First name must not exceed 200 characters',

            }),
        lname: Joi.string()
            .min(2)
            .max(200)
            .optional()
            .messages({
                'string.min': 'Last name must be at least 2 characters',
                'string.max': 'Last name must not exceed 200 characters',
                
            }),
        Bdate: Joi.date()
            .max('now') // No future dates
            .optional()
            .messages({
                'date.max': 'Birth date cannot be in the future',
            }),
        sex: Joi.string()
            .valid('male', 'female')
            .optional()
            .messages({
                'any.only': 'Sex must be either "male" or "female"',
            }),
        phone: Joi.string()
            .min(10)
            .max(15)
            .pattern(/^[0-9]+$/)
            .optional()
            .messages({
                'string.min': 'Phone number must be at least 10 digits',
                'string.max': 'Phone number must not exceed 15 digits',
                'string.pattern.base': 'Phone number must contain only digits',
            }),
        specialization: Joi.string()
            .max(200)
            .optional()
            .messages({
                'string.max': 'Specialization must not exceed 200 characters',
            }),
        status: Joi.string()
            .valid('active', 'inactive', 'pending')
            .messages({
                'any.only': 'Status must be "active", "inactive", or "pending"',
            })
    });
    return schema.validate(patientData,{ abortEarly: false });
    //{abortEarly: false}  to validate all of them then return list of problem not validtae only one 
    

}

export{
    cardiologistSchema,
    cardiologistValidationSchema,
    cardiologistUpdateSchema
}