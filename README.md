# Roblox Friend Remover

A simple Node.js web application for managing Roblox friends. Allows users to view their friend list, search through it, whitelist friends, and remove unchecked friends.

This Website is currently being hosted on https://rbxfriendremover.onrender.com

## Features

- Secure token-based authentication using .ROBLOSECURITY cookie
- View and search through friend list
- Whitelist friends to keep them
- Remove multiple friends at once
- Responsive web interface with Roblox-like styling
- Client-side search and filtering

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the server:
   ```bash
   yarn start
   ```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Obtain your .ROBLOSECURITY token:
   - Log in to Roblox in your browser
   - Open Developer Tools (F12)
   - Go to Application > Cookies > .roblosecurity.com
   - Copy the value of the `.ROBLOSECURITY` cookie

2. Paste the token into the app's input field and click "Login & View Friends"

3. Your friends list will load. Check the boxes next to friends you want to keep (whitelist)

4. Click "Remove Unchecked Friends" to remove the unchecked friends

5. Use the search bar to filter friends by name

## Security Warning

- This application processes your .ROBLOSECURITY token in memory only and does not store it permanently
- Never share your token with anyone
- Use this application at your own risk
- The application makes requests to Roblox APIs on your behalf
- Be aware that mass friend removal may violate Roblox's terms of service

## Technologies Used

- Node.js
- Express.js
- Axios
- HTML/CSS/JavaScript

## API Endpoints

The application uses the following Roblox API endpoints:
- `https://users.roblox.com/v1/users/authenticated` - Get authenticated user
- `https://friends.roblox.com/v1/users/{userId}/friends` - Get friends list
- `https://friends.roblox.com/v1/users/{targetUserId}/unfriend` - Remove friend
- `https://users.roblox.com/v1/users/{userId}` - Get user details

## Contributing

This project is for educational purposes. Contributions are welcome but use responsibly.

## License

This project is unlicensed. Use at your own risk.
