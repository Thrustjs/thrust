package br.com.softbox.thrust;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import br.com.softbox.thrustapi.ThrustAPI;

public class Thrust {
	private static String appDirectory;
	private static String thrustJarsDir;
	
	private ThrustAPI thrustAPI;
	
    public Thrust(String startupFilePath) {
    	try {
			Thrust.appDirectory = getAppDirectory(startupFilePath);
			Thrust.thrustJarsDir = Thrust.appDirectory + File.separator + ".lib" + File.separator + "jars";
			
			this.thrustAPI = new ThrustAPI(Thrust.appDirectory);
			
			loadRuntimeJars(startupFilePath);
			
			thrustAPI.require(startupFilePath);
			
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
    
    private void loadRuntimeJars(String startupFilePath) {
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
    
    public static void main( String[] args ) {
    	if(args.length < 1) {
    		throw new IllegalArgumentException("Missing file name. Try 'thrust <file name>'");
    	} 
    	
    	//TODO: receber todos os argumentos e passar para o script que será executado
        new Thrust(args[0]);
    }
    
    /* Getters and Setters*/
    public String getAppDirectory() {
    	return this.getAppDirectory();
    }
}