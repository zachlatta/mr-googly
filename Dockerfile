FROM node:5.10.1

# OpenCV Time #

# Install dependencies
RUN apt-get update
RUN apt-get install -y build-essential cmake git libgtk2.0-dev pkg-config libavcodec-dev libavformat-dev libswscale-dev python-dev python-numpy libtbb2 libtbb-dev libjpeg-dev libpng-dev libtiff-dev libjasper-dev libdc1394-22-dev

# Compilation
WORKDIR /tmp/opencv
ENV OPENCV_VERSION 3.1.0
RUN curl https://codeload.github.com/Itseez/opencv/tar.gz/$OPENCV_VERSION > opencv.tar.gz
RUN tar xzf opencv.tar.gz
RUN cmake CMAKE_BUILD_TYPE=RELEASE -D INSTALL_CREATE_DISTRIB=ON -D WITH_IPP=ON opencv-$OPENCV_VERSION
RUN make install -j $(nproc)
RUN ldconfig

# Node Time #

WORKDIR /app/src

RUN npm install nodemon -g

ADD package.json package.json
RUN npm install

COPY . .

EXPOSE 3000

CMD npm start
