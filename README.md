# MyTaxi - UTeM Student Ride Service

MyTaxi is a ride-sharing service specifically designed for UTeM (Universiti Teknikal Malaysia Melaka) students. It connects students who need rides with fellow student drivers, providing a safe, convenient, and affordable transportation solution within and around the campus.

## Features

- **User Authentication**: Secure login and registration system with role-based access control
- **Passenger Features**: Request rides, view ride history, manage profile
- **Driver Features**: Accept ride requests, manage availability, track earnings
- **Admin Dashboard**: User management, ride monitoring, system settings
- **Responsive Design**: Works on mobile, tablet, and desktop devices

## Tech Stack

- **Frontend**: Express.js, EJS templates, Bootstrap 5, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (to be integrated)
- **Authentication**: Session-based authentication

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mytaxi.git
   cd mytaxi
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Access the application:
   ```
   http://localhost:3000
   ```

## Project Structure

```
mytaxi/
├── index.js                # Main application entry point
├── src/
│   ├── routes/             # Route handlers
│   ├── views/              # EJS templates
│   ├── public/             # Static assets
│   │   ├── css/            # Stylesheets
│   │   ├── js/             # Client-side JavaScript
│   │   └── images/         # Images
│   ├── controllers/        # Route controllers
│   └── middlewares/        # Custom middleware
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

## Usage

### Passenger

1. Register as a passenger
2. Log in to your account
3. Request a ride by specifying pickup location, destination, date, and time
4. View your ride history and manage your profile

### Driver

1. Register as a driver
2. Log in to your account
3. Set your availability status
4. Accept ride requests
5. Complete rides and track your earnings

### Admin

1. Log in with admin credentials
2. Monitor user registrations and ride activities
3. Manage system settings
4. View statistics and reports

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.

## Contact

For questions or support, please email support@mytaxi.utem.edu.my. 