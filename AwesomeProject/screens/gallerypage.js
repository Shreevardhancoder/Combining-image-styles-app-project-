import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const GallerySelectionPage = ({ navigation }) => {
  const [contentImage, setContentImage] = useState(null);
  const [styleImage, setStyleImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stylizedImageData, setStylizedImageData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectImage = async (setImage) => {
    let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    let pickerResult = await ImagePicker.launchImageLibraryAsync();
    if (pickerResult.cancelled === true) {
      return;
    }

    let imageUri = pickerResult.assets[0].uri;
    setImage(imageUri);
  };

  const handleSubmit = async () => {
    if (!contentImage || !styleImage) {
      Alert.alert('Error', 'Please select both content and style images.');
      return;
    }

    setIsLoading(true);
    try {
      // Ensure contentBase64 and styleBase64 are defined before using them
      const contentBase64 = await convertToBase64(contentImage);
      const styleBase64 = await convertToBase64(styleImage);

      // Now that the base64 strings are defined, send them to the backend
      await sendImagesToBackend(contentBase64, styleBase64);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      Alert.alert('Submission Error', `Failed to submit images. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const convertToBase64 = async (imageUri) => {
    let response = await fetch(imageUri);
    let blob = await response.blob();
    return await blobToBase64(blob);
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const sendImagesToBackend = async (contentBase64, styleBase64) => {
    try {
      const imageDataArray = [{ image: contentBase64 }, { image: styleBase64 }];

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      const response = await fetch('http://192.168.148.60:5000/processimage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageDataArray),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server response:', errorData);
        throw new Error('Failed to send image to backend');
      }

      const responseData = await response.json();
      const stylizedImage = responseData.stylized_image;
      setStylizedImageData(stylizedImage);
      setModalVisible(true);
    } catch (error) {
      if (error.name === 'AbortError') {
        Alert.alert('Timeout Error', 'The request took too long. Please try again later.');
      } else {
        console.error('Error sending images to backend:', error);
        Alert.alert('Network Error', 'Could not connect to the server. Please try again later.');
      }
      throw error;
    }
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <TouchableOpacity onPress={() => selectImage(setContentImage)} style={styles.button}>
        <Text style={[styles.buttonText, { color: 'green' }]}>Select Content Image</Text>
      </TouchableOpacity>
      {contentImage && <Image source={{ uri: contentImage }} style={styles.image} />}
      
      <TouchableOpacity onPress={() => selectImage(setStyleImage)} style={styles.button}>
        <Text style={[styles.buttonText, { color: 'blue' }]}>Select Style Image</Text>
      </TouchableOpacity>
      {styleImage && <Image source={{ uri: styleImage }} style={styles.image} />}

      <TouchableOpacity onPress={handleSubmit} style={[styles.button, { backgroundColor: 'purple' }]}>
        <Text style={{ color: 'white' }}>Submit</Text>
      </TouchableOpacity>

      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}

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
                source={{ uri: `data:image/jpeg;base64,${stylizedImageData}` }}
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
  button: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 10,
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

export default GallerySelectionPage;
