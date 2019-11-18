package br.com.softbox.tpm.brief;

class Repo {
	public String origin;
	public String type;
	public String owner;
	public String name;
	public String checkout;

	public void setTypeAndOrigin(String type) {
		this.type = type;
		switch (this.type) {
		case "gitlab":
			origin = "gitlab.com";
			break;
		case "bitbucket":
			origin = "bitbucket.com";
			break;
		default:
			origin = "github.com";
			break;
		}
	}

}