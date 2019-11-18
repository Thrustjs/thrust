package br.com.softbox.tpm.brief;

import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

public final class PomHelper {

	private PomHelper() {
		super();
	}

	public static List<Jar> listRuntimeDependencies(Path pomPath) throws IOException, ParserConfigurationException {
		List<DependencyPOM> dependenciesPOM = listDependenciesPOM(pomPath);

		return dependenciesPOM.stream().filter(DependencyPOM::isRuntimeScope).map(DependencyPOM::asJar)
				.collect(Collectors.toList());
	}

	private static List<DependencyPOM> listDependenciesPOM(Path pomPath) throws IOException, ParserConfigurationException {
		try {
			DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
			DocumentBuilder docBuilder = dbf.newDocumentBuilder();

			Document xmlDoc = docBuilder.parse(pomPath.toFile());

			return listDependenciesDOMFromSAX(xmlDoc);

		} catch (SAXException e) {
			throw new RuntimeException("Failed to parse " + pomPath.toString(), e);
		}
	}

	private static List<DependencyPOM> listDependenciesDOMFromSAX(Document xmlDoc) {
		NodeList dependenciesNodeList = xmlDoc.getElementsByTagName("dependency");
		List<DependencyPOM> dependenciesPOM = new ArrayList<>();
		for (int indexDependency = 0; indexDependency < dependenciesNodeList.getLength(); indexDependency++) {
			buildDependencyPOMList(dependenciesNodeList, dependenciesPOM, indexDependency);
		}
		return dependenciesPOM;
	}

	private static void buildDependencyPOMList(NodeList dependenciesNodeList, List<DependencyPOM> dependenciesPOM,
			int indexDependency) {
		Node dependencyNode = dependenciesNodeList.item(indexDependency);
		NodeList dependencyDataList = dependencyNode.getChildNodes();
		addDependencyPOM(dependenciesPOM, dependencyDataList);
	}

	private static void addDependencyPOM(List<DependencyPOM> dependenciesPOM, NodeList dependencyDataList) {
		DependencyPOM dependencyPOM = new DependencyPOM();
		for (int indexData = 0; indexData < dependencyDataList.getLength(); indexData++) {
			Node dataNode = dependencyDataList.item(indexData);
			if (dataNode.getNodeType() == Node.ELEMENT_NODE) {
				Element dataElement = (Element) dataNode;
				final String attribute = dataElement.getNodeName();
				final String value = dataElement.getTextContent();
				switch (attribute) {
				case "version":
					dependencyPOM.setVersion(value);
					break;
				case "scope":
					dependencyPOM.setScope(value);
					break;
				case "groupId":
					dependencyPOM.setGroupId(value);
					break;
				case "artifactId":
					dependencyPOM.setArtifactId(value);
					break;
				default:
					break;
				}
			}
		}
		dependenciesPOM.add(dependencyPOM);
	}

}
