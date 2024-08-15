import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert, Button, Image, Modal, Platform } from "react-native";
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from "expo-secure-store";

const CameraPage = ({ navigation }) => {
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const cameraRef = useRef(null);
  const [stylizedImageData, setStylizedImageData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    setIsCameraVisible(false);
  }, []);

  const toggleCamera = () => {
    setIsCameraVisible(!isCameraVisible);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const { uri } = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
        console.log('Picture taken:', uri);

        setCapturedImages([...capturedImages, uri]);

        cameraRef.current.pausePreview();
        setIsCameraVisible(false);
      } catch (error) {
        console.error('Failed to take picture:', error);
        Alert.alert('Error', 'Failed to take picture: ' + (error.message || error));
      }
    }
  };

  const submitImages = async () => {
    try {
      const imageDataArray = [];

      await Promise.all(capturedImages.map(async (imageUri) => {
        let base64;
        if (Platform.OS === 'web') {
          // For web, use fetch API to read file as base64
          const response = await fetch(imageUri);
          const blob = await response.blob();
          base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          // For mobile, use expo-file-system
          base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
        }

        console.log(base64);
        imageDataArray.push({ image: base64 });
      }));

      const response = await fetch('http://192.168.148.60:5000/processimage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageDataArray),
      });

      if (!response.ok) {
        throw new Error('Failed to send image to backend');
      }

      const responseData = await response.json();
      const stylizedImage = responseData.stylized_image;
      setStylizedImageData(stylizedImage);
      setModalVisible(true);
    } catch (error) {
      console.error('Error submitting images:', error);
      Alert.alert('Error', 'Failed to submit images: ' + (error.message || error));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imagesContainer}>
        {capturedImages.map((imageUri, index) => (
          <Image key={index} source={{ uri: imageUri }} style={styles.capturedImage} />
        ))}
      </View>
      <Button title="Capture Content" onPress={toggleCamera} />
      <Button title="Capture Style" onPress={toggleCamera} />
      <Button title="Submit" onPress={submitImages} />
      {isCameraVisible && (
        <Camera style={styles.camera} type={Camera.Constants.Type.back} ref={cameraRef}>
          <Button title="Take Picture" onPress={takePicture} />
        </Camera>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            {stylizedImageData && (
              <Image
                source={{ uri: 
                'data:image/jpeg;base64,${stylizedImageData}' }}
                style={styles.stylizedImage}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
  },
  capturedImage: {
    width: 100,
    height: 100,
    margin: 5,
    borderRadius: 5,
  },
  camera: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stylizedImage: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
});

export default CameraPage;