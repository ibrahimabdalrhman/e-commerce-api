// roleMiddleware.js
function roleMiddleware(requiredRoles) {
    return (req, res, next) => {
        const user = req.user;        
        if (!user || !user.type) {
            return res.status(403).json({ message: "Access denied. No role found." });
        }
        
        if (!requiredRoles.includes(user.type)) {
            return res.status(403).json({ message: "Access denied. Insufficient role." });
        }

        next(); // Role is sufficient, proceed to the next middleware
    };
}

module.exports = roleMiddleware;
