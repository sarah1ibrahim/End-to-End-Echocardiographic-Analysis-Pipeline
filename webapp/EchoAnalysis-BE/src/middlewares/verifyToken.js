import jwt from "jsonwebtoken"
import dotenv from 'dotenv';

dotenv.config()

const verifyToken= (role)=>(req,res,next)=>{
    console.log('Entering verifyToken middleware...');
    console.log("request",req);
    try{
    const token=req.headers.token
    if(!token){
        return res.status(403).json({ masage: "'Token missing'"});
    }
    
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
        console.log("decoded",decoded);
        if(decoded.role !==role){
            return res.status(403).json({ message: 'Access denied' });
        }
        req.user=decoded // The is decoded payload includes id, email, and role and i just put it in req.user
        next();

    }catch(error){
        console.error("Token verification failed:", error.message);
        return res.status(403).json({ message: 'Invalid token',error:error.message });

    }
}


export{
    verifyToken
}
