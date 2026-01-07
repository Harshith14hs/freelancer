import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true
    },
    applicant:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    status:{
        type:String,
        enum:['pending', 'accepted', 'rejected'],
        default:'pending'
    },
    paymentStatus:{
        type:String,
        enum:['pending', 'completed', 'failed'],
        default:'pending'
    },
    paymentDate:{
        type:Date,
        default:null
    }
},{timestamps:true});
export const Application  = mongoose.model("Application", applicationSchema);