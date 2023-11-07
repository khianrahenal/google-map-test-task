import React, { useState, useEffect } from "react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import {
  addDoc,
  collection,
  Timestamp,
  updateDoc,
  doc,
} from "@firebase/firestore";
import { db } from "../firebase";

const placesLibrary = ["places"];

/**
 * Components - Map
 */
const Map = () => {
  const [places, setPlaces] = useState([]);
  const [center, setCenter] = useState();

  useEffect(() => {
    if (navigator.geolocation) {
      return navigator.geolocation.getCurrentPosition(showPosition);
    }
  }, []);

  function showPosition(position) {
    let lat = position.coords.latitude;
    let lng = position.coords.longitude;
    setCenter({ lat, lng });
  }

  /**
   * Add a marker on google map
   */
  const addMarker = (event) => {
    const newPlace = {
      id: places.length,
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    addQuest(newPlace);
  };

  const { isLoaded } = useLoadScript({
    googleMapsApiKey:process.env.REACT_APP_MAP_API_KEY,
    libraries: placesLibrary,
  });

  /**
   * Based on marker on google map enter the quest data in firebase (quests) collections
   */
  const addQuest = async (place) => {
    const timestamp = Timestamp.now();

    try {
      const mapCollectionRef = collection(db, "quests");
      addDoc(mapCollectionRef, {
        name: `Quest${place.id + 1}`,
        location: { lat: place.lat, lng: place.lng },
        timestamp: timestamp,
        next: null,
      }).then((res) => {
        place = { ...place, dbId: res.id };
        setPlaces([...places, place]);
        places[place.id - 1] &&
          updateDoc(doc(db, "quests", places[place.id - 1].dbId), {
            next: res.id,
          }).then((result) => {
            console.log(`update quest${place.id - 1}'s next`);
          });
      });
    } catch (error) {
      console.error("Error adding quest: ", error);
    }
  };

  return (
    <>
      {isLoaded ? (
        <GoogleMap
          onClick={addMarker}
          zoom={15}
          center={center}
          mapContainerStyle={{ width: "100%", height: "500px" }}
        >
          {places.map((item) => {
            return (
              <Marker
                key={item.id}
                label={{ text: `${item.id + 1}`, color: "white" }}
                position={{ lat: item.lat, lng: item.lng }}
              />
            );
          })}
        </GoogleMap>
      ) : (
        <h1>Loading...........</h1>
      )}
    </>
  );
};

export default Map;
