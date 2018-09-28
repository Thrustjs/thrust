FROM debian:latest

ENV DEBIAN_FRONTEND noninteractive
ENV JAVA_HOME /usr/lib/jvm/java-8-oracle
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8

# auto validate license
RUN apt-get update && \
    apt install -y locales curl software-properties-common gnupg && \
    echo "deb http://ppa.launchpad.net/webupd8team/java/ubuntu trusty main" | tee -a /etc/apt/sources.list && \
    echo "deb-src http://ppa.launchpad.net/webupd8team/java/ubuntu trusty main" | tee -a /etc/apt/sources.list && \
    echo oracle-java8-installer shared/accepted-oracle-license-v1-1 select true | /usr/bin/debconf-set-selections && \
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys EEA14886 && apt-get update && apt-get install -y curl dnsutils oracle-java8-installer ca-certificates && \
    locale-gen en_US.UTF-8 en_us && dpkg-reconfigure locales && dpkg-reconfigure locales && locale-gen C.UTF-8 && /usr/sbin/update-locale LANG=C.UTF-8

COPY ./src /opt/thrust/lib
COPY ./scripts/thrust.sh /opt/thrust/bin/thrust.sh

RUN ln -s /opt/thrust/bin/thrust.sh /usr/local/bin/thrust

# docker build -t thrustjs/thrust:latest -f hotspot.Dockerfile .
# docker run --rm --network="host" -v $(pwd):/app -w /app/test thrustjs/thrust:latest /bin/sh -c "thrust install && thrust test.js"