import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { Review } from "../models/review.model.js";

export const applyJob = async (req, res) => {
    try {
        const userId = req.id;
        const jobId = req.params.id;
        if (!jobId) {
            return res.status(400).json({
                message: "Job id is required.",
                success: false
            })
        };
        // check if the user has already applied for the job
        const existingApplication = await Application.findOne({ job: jobId, applicant: userId });

        if (existingApplication) {
            return res.status(400).json({
                message: "You have already applied for this jobs",
                success: false
            });
        }

        // check if the jobs exists
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found",
                success: false
            })
        }
        // create a new application
        const newApplication = await Application.create({
            job:jobId,
            applicant:userId,
        });

        job.applications.push(newApplication._id);
        await job.save();
        return res.status(201).json({
            message:"Job applied successfully.",
            success:true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error.", success: false });
    }
};
export const getAppliedJobs = async (req,res) => {
    try {
        const userId = req.id;
        const application = await Application.find({applicant:userId}).sort({createdAt:-1}).populate({
            path:'job',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'postedBy',
                select:'fullname email profile',
                options:{sort:{createdAt:-1}},
            }
        });
        return res.status(200).json({
            applications: application,
            success:true
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error.", success: false });
    }
}
// admin dekhega kitna user ne apply kiya hai
export const getApplicants = async (req,res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId).populate({
            path:'applications',
            options:{sort:{createdAt:-1}},
            populate:{
                path:'applicant'
            }
        });
        if(!job){
            return res.status(404).json({
                message:'Job not found.',
                success:false
            })
        };
        return res.status(200).json({
            job, 
            success:true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error.", success: false });
    }
}
export const updateStatus = async (req,res) => {
    try {
        const {status} = req.body;
        const applicationId = req.params.id;
        if(!status){
            return res.status(400).json({
                message:'status is required',
                success:false
            })
        };

        // find the application by applicantion id
        const application = await Application.findOne({_id:applicationId});
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        // update the status
        application.status = status.toLowerCase();
        await application.save();

        return res.status(200).json({
            message:"Status updated successfully.",
            success:true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error.", success: false });
    }
}

export const getApplicationById = async (req,res) => {
    try {
        const applicationId = req.params.id;
        const application = await Application.findById(applicationId).populate({
            path:'job',
            populate:{
                path:'postedBy',
                select:'fullname email profile'
            }
        }).populate({
            path:'applicant',
            select:'fullname email profile'
        });
        
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        return res.status(200).json({
            application,
            success:true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Error fetching application",
            success:false
        });
    }
}

export const markPaymentCompleted = async (req,res) => {
    try {
        const applicationId = req.params.id;
        
        const application = await Application.findById(applicationId);
        
        if(!application){
            return res.status(404).json({
                message:"Application not found.",
                success:false
            })
        };

        // Update payment status
        application.paymentStatus = 'completed';
        application.paymentDate = new Date();
        await application.save();

        return res.status(200).json({
            message:"Payment marked as completed successfully.",
            success:true,
            application
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:"Error marking payment as completed",
            success:false
        });
    }
}

export const getRecruiterHiredApplicants = async (req, res) => {
    try {
        const recruiterId = req.id;

        // Find all jobs posted by this recruiter
        const jobs = await Job.find({ postedBy: recruiterId });
        
        if (jobs.length === 0) {
            return res.status(200).json({
                message: "No jobs found for this recruiter.",
                success: true,
                applications: []
            });
        }

        const jobIds = jobs.map(job => job._id);

        // Find all accepted applications for these jobs
        const applications = await Application.find({
            job: { $in: jobIds },
            status: 'accepted'
        })
        .populate({
            path: 'applicant',
            select: 'fullname email profilePhoto'
        })
        .populate({
            path: 'job',
            select: 'title salary description postedBy',
            populate: {
                path: 'postedBy',
                select: 'fullname'
            }
        })
        .lean();

        // Fetch review information for each application
        const applicationsWithReviews = await Promise.all(
            applications.map(async (app) => {
                const review = await Review.findOne({ application: app._id }).lean();
                return {
                    ...app,
                    review: review || null
                };
            })
        );

        return res.status(200).json({
            message: "Hired applicants fetched successfully.",
            success: true,
            applications: applicationsWithReviews
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error fetching hired applicants",
            success: false
        });
    }
}

export const deleteApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.id;

        // Find and check if application exists
        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({
                message: "Application not found.",
                success: false
            });
        }

        // Verify the user is the applicant (only applicants can delete their applications)
        if (application.applicant.toString() !== userId) {
            return res.status(403).json({
                message: "Unauthorized: You can only delete your own applications.",
                success: false
            });
        }

        // Remove application from the job's applications array
        await Job.updateOne(
            { _id: application.job },
            { $pull: { applications: applicationId } }
        );

        // Delete the application
        await Application.findByIdAndDelete(applicationId);

        return res.status(200).json({
            message: "Application deleted successfully.",
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error deleting application",
            success: false
        });
    }
}