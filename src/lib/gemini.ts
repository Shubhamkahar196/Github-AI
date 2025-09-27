
import {GoogleGenerativeAI} from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({
    model: 'gemin-1.5-flash'
})

export const summariseCommit = async (diff: string) =>{

    const response = await model.generateContent({

        `You are an expert programmer, and you are trying to summarize a git diff.
        Remainders about the git diff format:
        For every file, there are a few metadata lines, like(for example):
        \'\'\'
        diff --git a/lib/index.js b/lib/index.js
        index aadf691..bfef603 100644
        --- a/lib/index.js
        +++ b/lib/index.js
          \'\'\'
          This means that 
        
        `
    })

}