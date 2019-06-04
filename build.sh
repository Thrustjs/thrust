echo "Cleaning build/libs directory..."
rm -rf build/libs
echo "Done!\n"

echo "Building thrust jar..."
./gradlew buildThrust
echo "Done!\n"

echo "Copying additional files to build/libs..."
cp -R cli build/libs
cp require.js build/libs
echo "Done!\n"

echo "All done! Check build/libs directory.\n"
