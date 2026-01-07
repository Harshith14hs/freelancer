import { Job } from "../models/job.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// freelancers post gigs
export const postJob = async (req, res) => {
    try {
        const { title, description, availability, salary, location, jobType, experienceLevel } = req.body;
        const freelancerId = req.id;

        const requiredFields = { title, description, availability, salary, location, jobType, experienceLevel };
        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value) {
                return res.status(400).json({ message: `The '${field}' field is required.`, success: false });
            }
        }

        // Handle resume file upload
        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: "A resume file is required.", success: false });
        }

        const fileUri = getDataUri(file);
        if (!fileUri) {
            return res.status(400).json({
                message: "Unable to process uploaded file.",
                success: false,
            });
        }

        const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
        
        const job = await Job.create({
            title,
            description,
            availability,
            salary: Number(salary),
            location,
            jobType,
            experienceLevel: experienceLevel,
            resume: cloudResponse.secure_url,
            postedBy: freelancerId
        });
        return res.status(201).json({
            message: "New gig created successfully.",
            job,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Server error.", success: false });
    }
}
// recruiters browse gigs
export const getAllJobs = async (req, res) => {
    try {
        const { keyword } = req.query;
        let query = {};
        if (keyword && keyword.trim() !== "") {
            query = {
                $or: [
                    { title: { $regex: keyword, $options: "i" } },
                    { description: { $regex: keyword, $options: "i" } },
                ]
            };
        }

        const jobs = await Job.find(query)
            .populate({
                path: "postedBy",
                select: "fullname email profile"
            })
            .sort({ createdAt: -1 });

        // If no jobs are found and there was no specific keyword search, return sample jobs.
        if (jobs.length === 0 && (!keyword || keyword.trim() === "")) {
            const sampleJobs = [
                {
                    _id: "668b3e34a8e1a651f22a7c8a",
                    title: "Senior React Developer",
                    description: "Looking for a skilled React developer to build modern web applications.",
                    availability: "Full-time",
                    salary: 1200000,
                    location: "Remote",
                    jobType: "Full-time",
                    experienceLevel: "Senior",
                    postedBy: { fullname: "Tech Solutions Inc." }
                },
                {
                    _id: "668b3e34a8e1a651f22a7c8b",
                    title: "Node.js Backend Engineer",
                    description: "Join our backend team to work on scalable and robust APIs.",
                    availability: "Full-time",
                    salary: 1000000,
                    location: "New York",
                    jobType: "Full-time",
                    experienceLevel: "Mid-Level",
                    postedBy: { fullname: "Data Systems LLC" }
                }
            ];
            return res.status(200).json({ jobs: sampleJobs, success: true });
        }

        return res.status(200).json({
            jobs,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error fetching jobs",
            success: false
        });
    }
}
// shared detail view
export const getJobById = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await Job.findById(jobId)
            .populate({
                path: "postedBy",
                select: "fullname email profile"
            })
            .populate({
                path: "applications",
                populate: {
                    path: "applicant",
                    select: "fullname email phoneNumber profile"
                }
            });
        if (!job) {
            return res.status(404).json({
                message: "Gig not found.",
                success: false
            });
        }
        return res.status(200).json({ job, success: true });
    } catch (error) {
        console.log(error);
    }
}
// freelanser gig dashboard
export const getFreelancerJobs = async (req, res) => {
    try {
        const freelancerId = req.id;
        const jobs = await Job.find({ postedBy: freelancerId }).sort({ createdAt: -1 });
        if (!jobs || jobs.length === 0) {
            return res.status(404).json({
                message: "Gigs not found.",
                success: false
            });
        }
        return res.status(200).json({
            jobs,
            success: true
        });
    } catch (error) {
        console.log(error);
    }
}

// freelancer update their job/gig
export const updateJob = async (req, res) => {
    try {
        const { title, description, availability, salary, location, jobType, experienceLevel } = req.body;
        const jobId = req.params.id;
        const freelancerId = req.id;

        // Find the job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false
            });
        }

        // Check if the user is the owner of the job
        if (job.postedBy.toString() !== freelancerId) {
            return res.status(403).json({
                message: "You are not authorized to update this job.",
                success: false
            });
        }

        // Update job fields
        if (title) job.title = title;
        if (description) job.description = description;
        if (availability) job.availability = availability;
        if (salary) job.salary = Number(salary);
        if (location) job.location = location;
        if (jobType) job.jobType = jobType;
        if (experienceLevel) job.experienceLevel = experienceLevel;
        
        // If a new resume is uploaded, upload to Cloudinary
        if (req.file) {
            const fileUri = getDataUri(req.file);
            if (!fileUri) {
                return res.status(400).json({
                    message: "Unable to process uploaded file.",
                    success: false,
                });
            }
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
            job.resume = cloudResponse.secure_url;
        }

        await job.save();

        return res.status(200).json({
            message: "Job updated successfully.",
            job,
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error.",
            success: false
        });
    }
}

// freelancer delete their job/gig
export const deleteJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const freelancerId = req.id;

        // Find the job
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                message: "Job not found.",
                success: false
            });
        }

        // Check if the user is the owner of the job
        if (job.postedBy.toString() !== freelancerId) {
            return res.status(403).json({
                message: "You are not authorized to delete this job.",
                success: false
            });
        }

        // Delete the job
        await Job.findByIdAndDelete(jobId);

        return res.status(200).json({
            message: "Job deleted successfully.",
            success: true
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server error.",
            success: false
        });
    }
}

// Comprehensive job categories and keywords
const jobCategories = {
    'web': ['web', 'frontend', 'backend', 'fullstack', 'full stack', 'html', 'css', 'javascript', 'react', 'vue', 'angular', 'node', 'nodejs', 'express', 'django', 'flask', 'laravel', 'php', 'asp.net', 'java', 'spring'],
    'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter', 'swift', 'kotlin', 'app development', 'appdev'],
    'data': ['data', 'analytics', 'scientist', 'engineering', 'bigdata', 'big data', 'hadoop', 'spark', 'sql', 'python', 'r programming', 'tableau', 'powerbi'],
    'devops': ['devops', 'deployment', 'docker', 'kubernetes', 'ci/cd', 'cicd', 'jenkins', 'infrastructure', 'aws', 'azure', 'gcp', 'cloud'],
    'ai': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'nlp', 'deep learning', 'tensorflow', 'pytorch', 'keras'],
    'design': ['design', 'ui', 'ux', 'graphic', 'figma', 'photoshop', 'creative', 'designer'],
    'qa': ['qa', 'quality', 'testing', 'automation', 'test', 'selenium', 'cypress', 'manual'],
    'security': ['security', 'infosec', 'cybersecurity', 'penetration', 'pentest', 'ethical hacking'],
    'database': ['database', 'sql', 'mongodb', 'postgres', 'mysql', 'dynamodb', 'redis', 'elasticsearch'],
};

const getJobCategory = (text) => {
    const textLower = text.toLowerCase();
    for (const [category, keywords] of Object.entries(jobCategories)) {
        for (const keyword of keywords) {
            if (textLower.includes(keyword)) {
                return category;
            }
        }
    }
    return null;
};

const calculateDetailedMatch = (userText, jobTitle, jobDesc) => {
    const userLower = userText.toLowerCase();
    const titleLower = jobTitle.toLowerCase();
    const descLower = jobDesc.toLowerCase();
    const combined = titleLower + " " + descLower;
    
    // Extract words (length > 2)
    const userWords = userLower.match(/\b\w+\b/g) || [];
    const cleanWords = userWords.filter(w => w.length > 2);
    
    if (cleanWords.length === 0) return 0;
    
    let matches = 0;
    for (const word of cleanWords) {
        if (combined.includes(word)) {
            matches++;
        }
    }
    
    return (matches / cleanWords.length) * 100;
};

// Local AI Job Matcher - Advanced matching algorithm
export const aiMatchJobs = async (req, res) => {
    try {
        console.log("AI Match Jobs - Request body:", req.body);
        const { textDescription, skills, experienceLevel, location, jobType, salaryRange } = req.body;

        if (!textDescription || textDescription.trim() === "") {
            return res.status(400).json({
                message: "Please provide job requirements",
                success: false
            });
        }
        
        console.log("AI Match Jobs - Text description:", textDescription);

        // Get all jobs from database
        const allJobs = await Job.find()
            .populate({
                path: "postedBy",
                select: "fullname email profile"
            })
            .sort({ createdAt: -1 });

        console.log(`Total jobs in database: ${allJobs.length}`);

        if (allJobs.length === 0) {
            return res.status(200).json({
                message: "No jobs available",
                matchedJobs: [],
                matchDetails: [],
                success: true
            });
        }

        const userCategory = getJobCategory(textDescription);
        console.log(`User search category: ${userCategory}`);

        // Extract salary filter from search
        const extractSalaryFilter = () => {
            const searchText = (salaryRange || textDescription || "").toLowerCase();
            const numbers = searchText.match(/\d+/g) || [];
            let salaryFilter = null;
            
            if (numbers.length > 0) {
                const firstNumber = parseInt(numbers[0]);
                
                if (searchText.includes('under') || searchText.includes('below') || 
                    searchText.includes('maximum') || searchText.includes('upto') || 
                    searchText.includes('up to') || searchText.includes('max') ||
                    searchText.includes('less than')) {
                    salaryFilter = { type: 'max', value: firstNumber };
                } else if (searchText.includes('above') || searchText.includes('minimum') || 
                          searchText.includes('atleast') || searchText.includes('at least') ||
                          searchText.includes('more than') || searchText.includes('min')) {
                    salaryFilter = { type: 'min', value: firstNumber };
                } else if ((searchText.includes(' to ') || searchText.includes('between')) && numbers.length >= 2) {
                    salaryFilter = { type: 'range', min: firstNumber, max: parseInt(numbers[1]) };
                }
            }
            
            return salaryFilter;
        };

        const salaryFilter = extractSalaryFilter();
        console.log(`Salary filter extracted: ${JSON.stringify(salaryFilter)}`);

        const calculateMatchScore = (job) => {
            let score = 0;
            let reasons = [];

            // HARD FILTER: Check salary first
            if (salaryFilter) {
                let salaryMatch = false;
                
                if (salaryFilter.type === 'max' && job.salary) {
                    salaryMatch = job.salary <= salaryFilter.value;
                } else if (salaryFilter.type === 'min' && job.salary) {
                    salaryMatch = job.salary >= salaryFilter.value;
                } else if (salaryFilter.type === 'range' && job.salary) {
                    salaryMatch = job.salary >= salaryFilter.min && job.salary <= salaryFilter.max;
                }
                
                // If salary filter is specified and doesn't match, return 0 score (reject job)
                if (!salaryMatch) {
                    return { score: 0, reasons: ['Salary does not match filter'], salaryFiltered: true };
                }
                
                score += 5;
                reasons.push(`Salary: ₹${job.salary.toLocaleString('en-IN')}`);
            }

            const titleLower = (job.title || "").toLowerCase();
            const descLower = (job.description || "").toLowerCase();
            const combined = titleLower + " " + descLower;

            // 1. TEXT MATCHING (30 points)
            const textMatch = calculateDetailedMatch(textDescription, job.title || "", job.description || "");
            score += Math.min(textMatch * 0.3, 30);
            if (textMatch > 30) {
                reasons.push(`Text match: ${Math.round(textMatch)}%`);
            }

            // 2. CATEGORY MATCHING (20 points) - HARD FILTER FOR MISMATCHES
            const jobCategory = getJobCategory(combined);
            if (userCategory && jobCategory) {
                if (userCategory === jobCategory) {
                    score += 20;
                    reasons.push(`Category: ${userCategory}`);
                } else {
                    // HARD FILTER: Different category - reject unless there's strong text match
                    if (textMatch < 40) {
                        return { score: 0, reasons: [`Wrong category: looking for ${userCategory}, found ${jobCategory}`], categoryMismatched: true };
                    }
                    score += 3;
                    reasons.push(`Partial match: ${jobCategory}`);
                }
            } else if (userCategory && !jobCategory) {
                // User specified a clear category but job doesn't match - reject
                return { score: 0, reasons: [`No relevant category match found`], categoryMismatched: true };
            } else if (jobCategory) {
                score += 12;
                reasons.push(`Job: ${jobCategory}`);
            }

            // 3. SKILL MATCHING (15 points)
            if (skills && skills !== 'any') {
                const skillsLower = skills.toLowerCase();
                const skillWords = skillsLower.split(/[,\s]+/).filter(s => s.length > 2);
                
                let skillMatches = 0;
                for (const skill of skillWords) {
                    if (combined.includes(skill)) {
                        skillMatches++;
                    }
                }
                
                if (skillMatches > 0) {
                    const skillScore = (skillMatches / Math.max(skillWords.length, 1)) * 15;
                    score += skillScore;
                    reasons.push(`Skills: ${skills}`);
                }
            }

            // 4. EXPERIENCE LEVEL MATCHING (12 points)
            if (experienceLevel && experienceLevel !== 'any' && job.experienceLevel) {
                const jobExp = (job.experienceLevel || "").toLowerCase();
                const userExp = experienceLevel.toLowerCase();
                
                if (jobExp === userExp || 
                    jobExp.includes(userExp) || 
                    userExp.includes(jobExp)) {
                    score += 12;
                    reasons.push(`Experience: ${job.experienceLevel}`);
                } else if (
                    (userExp === 'senior' && (jobExp.includes('senior') || jobExp.includes('lead'))) ||
                    (userExp === 'junior' && jobExp.includes('junior')) ||
                    (userExp.includes('mid') && (jobExp.includes('mid') || jobExp.includes('intermediate')))
                ) {
                    score += 6;
                    reasons.push(`Experience: ${job.experienceLevel}`);
                }
            }

            // 5. JOB TYPE MATCHING (10 points)
            if (jobType && jobType !== 'any' && job.jobType) {
                const jobTypeVal = (job.jobType || "").toLowerCase();
                const userJobType = jobType.toLowerCase();
                if (jobTypeVal === userJobType || jobTypeVal.includes(userJobType) || userJobType.includes(jobTypeVal)) {
                    score += 10;
                    reasons.push(`Type: ${job.jobType}`);
                }
            } else if (job.jobType) {
                score += 3;
            }

            // 6. LOCATION MATCHING (8 points)
            if (location && location !== 'any' && job.location) {
                const jobLoc = (job.location || "").toLowerCase();
                const userLoc = location.toLowerCase();
                if (jobLoc === userLoc) {
                    score += 8;
                    reasons.push(`Location: ${job.location}`);
                } else if (jobLoc.includes('remote') || userLoc.includes('remote')) {
                    score += 5;
                    reasons.push(`Location: ${job.location}`);
                } else if (jobLoc.includes(userLoc.split(' ')[0]) || userLoc.includes(jobLoc.split(' ')[0])) {
                    score += 3;
                    reasons.push(`Location: ${job.location}`);
                }
            } else if (job.location) {
                score += 2;
            }

            // 7. AVAILABILITY MATCHING (5 points)
            if (job.availability) {
                const availLower = (job.availability || "").toLowerCase();
                const userTextLower = textDescription.toLowerCase();
                
                if ((userTextLower.includes('full-time') || userTextLower.includes('fulltime')) && availLower.includes('full')) {
                    score += 5;
                    reasons.push(`Availability: ${job.availability}`);
                } else if ((userTextLower.includes('part-time') || userTextLower.includes('parttime')) && availLower.includes('part')) {
                    score += 5;
                    reasons.push(`Availability: ${job.availability}`);
                } else if ((userTextLower.includes('freelance') || userTextLower.includes('contract')) && 
                          (availLower.includes('freelance') || availLower.includes('contract') || availLower.includes('project'))) {
                    score += 5;
                    reasons.push(`Availability: ${job.availability}`);
                } else if ((userTextLower.includes('immediate') || userTextLower.includes('asap')) && 
                          (availLower.includes('immediate') || availLower.includes('asap'))) {
                    score += 3;
                    reasons.push(`Availability: ${job.availability}`);
                }
            }

            return { score: Math.min(score, 100), reasons };
        };

        // Calculate scores for all jobs
        const jobMatches = allJobs
            .map((job, index) => {
                const { score, reasons } = calculateMatchScore(job);
                console.log(`Job ${index + 1} "${job.title}": Score = ${score.toFixed(2)}, Reasons: ${reasons.join(", ")}`);
                return {
                    jobIndex: index + 1,
                    matchPercentage: Math.round(score),
                    reason: reasons[0] || "Matches your search",
                    whyGoodFit: reasons.join(" • ") || "Job matches your requirements",
                    score
                };
            })
            .filter(match => match.matchPercentage >= 40)
            .sort((a, b) => b.matchPercentage - a.matchPercentage);

        console.log(`Matches after filtering (>=40%): ${jobMatches.length}`);

        // Map indices to actual jobs
        const matchedJobs = jobMatches
            .map(match => {
                const jobData = allJobs[match.jobIndex - 1];
                const jobObject = jobData.toObject ? jobData.toObject() : jobData;
                return {
                    ...jobObject,
                    matchPercentage: match.matchPercentage,
                    matchReason: match.reason,
                    whyGoodFit: match.whyGoodFit
                };
            })
            .filter(job => job && job._id);

        console.log(`Final matched jobs: ${matchedJobs.length}`);

        return res.status(200).json({
            message: `Found ${matchedJobs.length} matching jobs`,
            matchedJobs,
            matchDetails: jobMatches,
            success: true
        });

    } catch (error) {
        console.error("AI matching error:", error);
        console.error("Error stack:", error.stack);
        
        return res.status(500).json({
            message: error.message || "Error in job matching",
            success: false
        });
    }
}
