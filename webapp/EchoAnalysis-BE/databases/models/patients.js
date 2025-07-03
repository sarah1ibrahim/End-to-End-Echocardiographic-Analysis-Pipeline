import { Sequelize, DataTypes } from "sequelize";
import { connection } from "../dbConnection.js";
import Joi from "joi";

const patientSchema = connection.define("Patients", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cardiologistId: {
    type: DataTypes.INTEGER,
    references: {
      model: "Cardiologists",
      key: "id",
    },
    allowNull: true,
    // constraints
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  },
  first_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  last_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  Bdate: {
    type: DataTypes.DATEONLY,
  },
  sex: {
    type: DataTypes.ENUM("male", "female"),
    allowNull: false,
  },

  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    // unique: true
  },
  weight: {
    type: DataTypes.FLOAT,
  },
  height: {
    type: DataTypes.FLOAT,
  },
});

connection
  .sync()
  .then(() => {
    console.log("table created succecssfully ");
  })
  .catch((err) => {
    console.log("can not syncing database", err);
  });

const patientValidationSchema = (patientData) => {
  const schema = Joi.object({
    fname: Joi.string().min(2).max(200).required(),
    lname: Joi.string().min(2).max(200).required(),
    Bdate: Joi.date()
      .iso() // Ensures the date is in ISO 8601 format (e.g., "YYYY-MM-DD")
      .max("now") // Ensures the date is not in the future
      .required()
      .messages({
        "date.base": "Birth date must be a valid date",
        "date.max": "Birth date cannot be in the future",
        "any.required": "Birth date is required",
      }),
    sex: Joi.string().valid("male", "female").required(),
    phone: Joi.string()
      .min(10)
      .max(15)
      .required()
      .pattern(/^[0-9]+$/),
      
    weight: Joi.number().min(0).required(),
    height: Joi.number().min(0).required(),
  });
  return schema.validate(patientData, { abortEarly: false });
};



const patientUpdateSchema = (patientData)=>{
    const schema = Joi.object({
        fname: Joi.string().min(2).max(200),
    lname: Joi.string().min(2).max(200),
    Bdate: Joi.date()
      .iso() // Ensures the date is in ISO 8601 format (e.g., "YYYY-MM-DD")
      .max("now") // Ensures the date is not in the future
      
      .messages({
        "date.base": "Birth date must be a valid date",
        "date.max": "Birth date cannot be in the future",
        "any.required": "Birth date is required",
      }),
    sex: Joi.string().valid("male", "female"),
    phone: Joi.string()
      .min(10)
      .max(15)
      .pattern(/^[0-9]+$/),
      
    weight: Joi.number().min(0),
    height: Joi.number().min(0),
    });
    return schema.validate(patientData,{ abortEarly: false });
    //{abortEarly: false}  to validate all of them then return list of problem not validtae only one 
    

}

export { patientSchema, patientValidationSchema,patientUpdateSchema };
