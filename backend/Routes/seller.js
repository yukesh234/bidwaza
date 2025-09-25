import express from "express";


const router = express.Router();

router.post('/addProduct', (req,res) =>{
    res.send("product route")
} )


export default router;

