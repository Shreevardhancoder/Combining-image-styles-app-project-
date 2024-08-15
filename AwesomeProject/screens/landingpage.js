import React, { useState, useRef,useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image } from "react-native";
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker from expo-image-picker
import {useNavigation} from "@react-navigation/native";
import * as FileSystem from 'expo-file-system';
import * as SecureStore from "expo-secure-store";


const Landingpage = () => {
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  const isMounted = useRef(true);
  const [stylizedImage, setStylizedImage] = useState(null);
  useEffect(() => {
    return () => {
      isMounted.current = false; // Set to false when the component unmounts
    };
  }, []);


  const toggleCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.pausePreview(); // Pause the preview before toggling visibility
    }
    setIsCameraVisible(!isCameraVisible);
 };

 const takePicture = async () => {
  console.log("Button Clicked")
  if (cameraRef.current) {
     try {
       const { uri } = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
       console.log('Picture taken:', uri);
     
 
       // Convert base64 to byte stream
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      console.log(base64)
      
      cameraRef.current.pausePreview(); // Pause the camera preview
      setIsCameraVisible(false); // Hide the camera view
      navigation.navigate('landingpage'); // Navigate back to the dashboard
 
       // Send byte stream to backend
      sendImageToBackend(base64); 
 
     } catch (error) {
       console.error('Failed to take picture:', error);
       Alert.alert('Error', 'Failed to take picture: ' + (error.message || error));
     }
  }
 };

 const sendImageToBackend = async (byteStream) => {
  try {
    let userID = await SecureStore.getItemAsync("userID").catch(error => {
        console.error("Error retrieving userID:", error);
        throw error;
    });
    let srcLang = await SecureStore.getItemAsync("language").catch(error => {
      console.error("Error retrieving userID:", error);
      throw error; 
  });
    const response = await fetch('http://192.168.148.60:5000/processimage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imageUri: byteStream
        })
    }).catch(error => {
        console.error("Error sending audio to backend:", error);
        throw error; // Rethrow the error to be caught by the outer try-catch
    });

    // Assuming you want to do something with the response, like checking the status
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Process the response as needed
    // For example, if you expect JSON in the response:
    const data = await response.json();
    console.log("the json data is\n");
    console.log(data);
    setStylizedImage(data.stylized_image);
    // navigation.navigate('StylizedImage', { stylizedImageData: base64Image });
    navigation.navigate('StylizedImage', { stylizedImageData: data.stylized_image });
} catch (error) {
    console.error("An error occurred:", error);
    
}
  };
const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access the gallery was denied.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.cancelled) {
        console.log('Image picked from gallery:', result.uri);
        navigation.navigate('Styles', { uri: result.uri });
      }
    } catch (error) {
      console.error('Failed to pick image from gallery:', error);
      Alert.alert('Error', 'Failed to pick image from gallery: ' + (error.message || error));
    }
  };

  return (
    <View style={styles.container}>
      {isCameraVisible && (
        <Camera style={styles.camera} type={Camera.Constants.Type.back} ref={cameraRef}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            {/* Image button to take picture */}
            {/* <Image
              source={require('./assets/camera.png')} // Specify the path to your image
              style={styles.cameraButtonImage}
            /> */}
            <View><Text>cam</Text></View>
          </TouchableOpacity>
        </Camera>
      )}

      {!isCameraVisible && (
        <View style={styles.fullScreen}>
          <Text style={styles.title}>Your styles</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={()=>navigation.navigate('camerapage')}>
              {/* Image button to switch to camera view */}
              {/* <Image
                source={require('./assets/camera.png')} // Specify the path to your image
                style={styles.cameraButtonImage}
              /> */}
              
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={()=>navigation.navigate('gallerypage')}>
              {/* Image button to pick image from gallery */}
              {/* <Image
                source={require('./assets/gallery.png')} // Specify the path to your image
                style={styles.cameraButtonImage}
              /> */}

              
              <Text style={styles.buttonText}>Pick from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

      )}
      {/* <View style={styles.stylizedImageContainer}>
        {stylizedImage && (
          <Image source={{ uri: `data:image/png;base64,${stylizedImage}` }} style={styles.stylizedImage} />
        )}
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c4c6ee', // Background color set to light gray
  },
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333', // Title color set to dark gray
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#007bff', // Button background color set to blue
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#fff', // Button text color set to white
    marginLeft: 10,
    fontSize: 18,
  },
  cameraButtonImage: {
    width: 24, // Specify the width of your image button
    height: 24, // Specify the height of your image button
  },
  camera: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    marginBottom: 20,
  },
  stylizedImageContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  stylizedImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
});

export default Landingpage;
