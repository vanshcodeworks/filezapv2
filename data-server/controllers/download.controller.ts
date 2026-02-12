import type { Request , Response } from "express";
export function download(req : Request, res : Response){
    let id = req.params.id;
    // real URL fetch from mongoDB 
    // if not exist send "not exist"
    // utility file to get signed url from S3
    //  send signed url to res , status
    res.send({
        message : id
    })
    return;
}