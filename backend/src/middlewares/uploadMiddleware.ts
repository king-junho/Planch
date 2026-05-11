import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.resolve(__dirname, "../../uploads");

if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir,{recursive:true});
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    },
});

function fileFilter(
    _req : Express.Request,
    file : Express.Multer.File,
    cb : multer.FileFilterCallback,
){
    if(!file.mimetype.startsWith("image/")){
        cb(new Error("이미지 파일만 업로드할 수 있습니다."));
        return;
    }
    cb(null, true);
}

export const tripRoomImageUpload = multer({
    storage,
    fileFilter,
    limits:{
        fileSize: 5*1024*1024,
    },
});