# When to trigger `build.bat`

The `build.bat` script is responsible for compiling your Next.js code and packaging your Electron application into a distributable executable (`.exe` file). 

You do **NOT** need to run `build.bat` every time you use the app or add data. You only need to run it when you make structural changes to the application itself.

### ✅ When YOU SHOULD run `build.bat`:

1. **Code Changes**: You modified the React components (`.tsx` files), CSS, or API routes.
2. ️**Electron Changes**: You modified the Electron main process code (inside the `/electron` folder).
3. **Dependency Updates**: You installed new packages via `npm install` and need them bundled into the desktop app.
4. **Releasing a New Version**: You are ready to share a new version of the app with your users (this will generate the installer).
5. **Configuration Changes**: You changed Next.js config, environment variables, or package metadata.

---

### ❌ When YOU DO NOT NEED to run `build.bat`:

1. **Adding Data**: Adding new mobiles, brands, or compatibility records. Data is saved in the local SQLite database and read dynamically at runtime.
2. **Uploading Images**: Uploading new images for devices. These are stored directly in the database.
3. **Daily Usage**: Just running the app for normal usage (you can just run the compiled `.exe` or use `start.bat` for development).

### 🤖 Do I need to run anything before `build.bat`?

**No.** You do not need to run any other build commands before running `build.bat`. 
The script is fully automated and handles the entire process from start to finish. When you run it, it automatically:
1. Installs any missing dependencies (`npm install`)
2. Builds the Next.js React code
3. Compiles the Electron wrapper
4. Rebuilds native SQLite database modules
5. Packages everything into the final `.exe` installer

### Summary
Think of `build.bat` as the "manufacturing process" of your app. You only need to manufacture a new app when the design or features change, not when the data inside it changes. Simply run `build.bat` and let it do all the heavy lifting!
