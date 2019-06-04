package br.com.softbox.thrust.core;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.graalvm.polyglot.Value;

import br.com.softbox.thrust.api.ThrustAPI;

public class Thrust {
	private ThrustAPI thrustAPI;
	
	private static String appDirectory;
	private static String thrustJarsDir;
	
    public Thrust(String[] args) throws URISyntaxException {
    	try {
    		if(args.length == 1 && args[0].endsWith(".js")) {
    			Thrust.appDirectory = getAppDirectory(args[0]);
    			Thrust.thrustJarsDir = Thrust.appDirectory + File.separator + ".lib" + File.separator + "jars";
    			
    			loadRuntimeJars();
    			
    			this.thrustAPI = new ThrustAPI(Thrust.appDirectory);
    			this.thrustAPI.require(args[0]);
    		} else {
    			//Try to find "jar" directory to find cli
    			String cliRootPath = new File(Thrust.class.getProtectionDomain().getCodeSource().getLocation().toURI()).getParent() + "/cli";
    			
    			//If it fails (when in dev mode, for example), gets cli from project rootpath
    			if(!new File(cliRootPath).exists()) {
    				cliRootPath = new File(Paths.get("./cli").toString()).getCanonicalPath();
    			}
    			
    			this.thrustAPI = new ThrustAPI(cliRootPath);
    			
    			Value cliBitcode = thrustAPI.require("./index.js");
    			
    			String argsString = Arrays.toString(args);
    			argsString = argsString.substring(1, argsString.length() - 1);
    			
    			cliBitcode.invokeMember("process", argsString);
    		}
		} catch (IOException e) {
			e.printStackTrace();
		}
    }
    
    private String getAppDirectory(String startupFilePath) throws IOException {
    	String cannonicalFilePath;
    	
    	if(startupFilePath.startsWith("./") || startupFilePath.startsWith("../")) {
			cannonicalFilePath = new File(".").getCanonicalPath() + File.separator + startupFilePath;
		} else if(startupFilePath.startsWith("/")) {
			cannonicalFilePath =  startupFilePath;
		} else {
			cannonicalFilePath =  new File(".").getCanonicalPath() + File.separator + startupFilePath;
		}
    	
    	return new File(cannonicalFilePath).getParent();
    }
    
    private void loadRuntimeJars() {
    	if(!new File(thrustJarsDir).exists()) {
    		return;
    	}
    	
    	List<File> jarsDirectoryFiles = new ArrayList<File>(Arrays.asList(new File(thrustJarsDir).listFiles()));
    	
    	jarsDirectoryFiles
    		.stream()
    		.forEach((file) -> {
    			//TODO: scan folders recursively
    			if(file.isFile()) {
    				try {
    					loadJar(file.getCanonicalPath());
    				} catch (Exception e) {
    					e.printStackTrace();
    				} 
        		}
    		});
    	
    	jarsDirectoryFiles.clear();
    	jarsDirectoryFiles = null;
    }
    
    private void loadJar(String jarPath) throws FileNotFoundException, NoSuchMethodException, SecurityException, IllegalAccessException, IllegalArgumentException, InvocationTargetException, MalformedURLException {
		if(jarPath == null) {
			throw new IllegalArgumentException("Jar path cannot be null!");
		}
		
		File jarFile = new File(jarPath);
		
		if(!jarFile.exists()) {
			throw new FileNotFoundException("Jar file not found: " + jarPath);
		}
		
		Method method = URLClassLoader.class.getDeclaredMethod("addURL", new Class[] {URL.class});
		method.setAccessible(true);
		
		method.invoke(ClassLoader.getSystemClassLoader(), (Object[]) new URL[] {jarFile.toURI().toURL()});
	}
    
    public static void main(String[] args) throws URISyntaxException {
    	new Thrust(args);
    }
    
    /* Getters and Setters*/
    public String getAppDirectory() {
    	return this.getAppDirectory();
    }
}