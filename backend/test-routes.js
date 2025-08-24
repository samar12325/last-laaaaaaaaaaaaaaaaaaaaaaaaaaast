const express = require('express');
const app = express();

// Import routes
const employeeRoutes = require('./routes/employeeRoutes');

// Middleware
app.use(express.json());

// Test routes
app.get('/test', (req, res) => {
    res.json({ message: 'Test server is working' });
});

// Mount employee routes
app.use('/api/employee', employeeRoutes);

// List all routes
app.get('/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach(middleware => {
        if (middleware.route) {
            routes.push({
                path: middleware.route.path,
                methods: Object.keys(middleware.route.methods)
            });
        } else if (middleware.name === 'router') {
            middleware.handle.stack.forEach(handler => {
                if (handler.route) {
                    routes.push({
                        path: '/api/employee' + handler.route.path,
                        methods: Object.keys(handler.route.methods)
                    });
                }
            });
        }
    });
    res.json(routes);
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log('Available routes:');
    console.log('- GET /test');
    console.log('- GET /routes');
    console.log('- GET /api/employee/profile');
    console.log('- GET /api/employee/complaints');
});
