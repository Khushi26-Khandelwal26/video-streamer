const asyncHandler = (requestHandler)=>{(req,res,next)=>{
    Promise.resolve(
        requestHandler(req,res,next)
    ).catch((err)=>
        next(err) // error passed to next middleware
    )
}}
//The code defines a higher-order function asyncHandler,which is used as utility 
// to handle asynchronous middleware or route handlers in a framework like 
// Express.js. This function ensures that any errors occurring in the 
// requestHandler are properly caught and passed to the next middleware 
// using next(err)


export {asyncHandler}
//first method
// const asyncHandler = (fn)=>async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
        
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message : error
//         })
//     }
// }