import { Sequelize,DataTypes } from 'sequelize';
import { connection } from '../dbConnection.js';
import Joi from 'joi';
const AdminSchema =connection.define('admins',{
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
    
    
})


await connection.sync()
    .then(() =>{
        console.log("table created succecssfully ")
    })
    .catch((err)=>{
        console.log("can not syncing database",err)
    })

const adminValidationSchema = (adminData)=>{
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
            })
        
    });
    return schema.validate(adminData,{ abortEarly: false });
    //{abortEarly: false}  to validate all of them then return list of problem not validtae only one 
    

}
const adminUpdateSchema = (adminData)=>{
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
        
    });
    return schema.validate(adminData,{ abortEarly: false });
    //{abortEarly: false}  to validate all of them then return list of problem not validtae only one 
    

}

export{
    AdminSchema,
    adminUpdateSchema,
    adminValidationSchema
    
}