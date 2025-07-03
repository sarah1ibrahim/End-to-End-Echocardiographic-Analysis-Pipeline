import { Sequelize,DataTypes, STRING } from 'sequelize';
import { connection } from '../dbConnection.js';


const fileSchema =connection.define('files',{
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    patientId:{
        type: DataTypes.INTEGER,
        references: {
            model: 'Patients',
            key: 'id'
        },
        allowNull: false,
        // constraints
        onUpdate: 'CASCADE', 
        onDelete: 'RESTRICT' 
    },
    orginalImageName: {
        type:DataTypes.STRING,
    },
    segmentedImageName:{
        type: DataTypes.STRING,
    },
    isModified:{
        type: DataTypes.BOOLEAN,
        defaultValue: false 
    },
    path:{
        type:DataTypes.STRING,
    },
    newImageName: {
        type:DataTypes.STRING,
    },
    newSegmentedImageName:{
        type: DataTypes.STRING,
    },
    measurementParameters: {
    type: DataTypes.JSON,
    allowNull: true
}
    
    
    
    
})


connection.sync()
    .then(() =>{
        console.log("table created succecssfully ")
    })
    .catch((err)=>{
        console.log("can not syncing database",err)
    })


export{
    fileSchema
}
