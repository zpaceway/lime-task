# AI Scribe Notes

Clinical notes management tool with voice transcription.

## Demo

[Video Demo](https://drive.google.com/file/d/1a0op3L9DmNliSd5HQUN3-prsUcnxHRub/view)

## Features

- Create clinical notes with text or voice input
- Real-time voice transcription using Chrome Web Speech API
- Patient management system
- Audio storage in database

## Screenshots

### Notes List

![Notes List](.screenshots/1.png)

### Create Note - Text Input

![Create Note - Text](.screenshots/2.png)

### Create Note - Voice Recording

![Voice Recording](.screenshots/3.png)

### Notes List View

![Notes List View](.screenshots/4.png)

### Note Details with Patient Information

![Note Details](.screenshots/5.png)

## Prerequisites

- Node.js 18+
- Docker

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
NODE_ENV="development"
```

## Setup

```bash
make init
```
