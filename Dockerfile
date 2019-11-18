FROM oracle/graalvm-ce:19.2.1
COPY . /opt/thrust-build
WORKDIR /opt/graalvm
RUN gu install native-image
WORKDIR /opt/thrust-build/thrust-core
RUN ./gradlew clean build --no-daemon && \
    mkdir -p /opt/thrust/jars && \
    cp ./build/libs/*.jar /opt/thrust/jars/. && \
    cp ./scripts/thrust /opt/thrust/. && \
    chmod a+x /opt/thrust/thrust
WORKDIR /opt/thrust-build/tpm
RUN sh ./build-tpm.sh && \
    cp ./build/tpm /opt/thrust && \
    chmod a+x /opt/thrust/tpm
ENV THRUST_VERSION 0.8.0
ENV THRUST_HOME /opt/thrust
ENV PATH $THRUST_HOME:$PATH
WORKDIR /opt/thrust
RUN ln -s /opt/graalvm-ce-19.2.1 graalvm && \
    cp graalvm/jre/lib/amd64/libsunec.so . && \
    rm -rf /opt/thrust-dist

