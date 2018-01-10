function get(urlToRead, params) {
	var result = new java.lang.StringBuilder();
	var url = new java.net.URL(urlToRead);
	var conn = url.openConnection();
	
	conn.setRequestMethod("GET");
	
	var reader = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()));
	
	var line;
	
	while ((line = reader.readLine()) != null) {
	   result.append(line);
	}
	
	reader.close();
	
	return result.toString();
}

exports = {
	get: get
}