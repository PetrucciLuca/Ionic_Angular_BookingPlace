import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Place } from './place.model';
import { take, map, tap, delay, switchMap } from 'rxjs/operators';
import { PlaceLocation } from './location.model';


// [
//   new Place(
//     'p1', 
//     'Roma', 
//     'Caput of Mundi',
//     'https://www.artribune.com/wp-content/uploads/2016/07/Colosseo-roma.jpg',
//      10.00,
//      new Date('2020-10-19'),
//      new Date('2025-10-19'),
//      'xc'
//      ),

//   new Place(
//     'p2', 
//     'Napoli', 
//     "L'amerai",
//     'https://tse3.mm.bing.net/th?id=OIP.oiD3AdktZq8z_dDf4HGUYwHaEK&pid=Api&P=0&w=270&h=152',
//      15.00,
//      new Date('2020-10-19'),
//      new Date('2025-10-19'),
//      'abc'
//   ),

//   new Place(
//     'p3', 
//     'Milano', 
//     'La madonnina',
//     'https://milanomagazine.files.wordpress.com/2011/12/madonnina.jpg',
//      12.00,
//      new Date('2020-10-19'),
//      new Date('2025-10-19'),
//      'abc'
//   )
// ]

interface PlaceData {
  availableFrom: string;
  availableTo: string;
  description: string;
  imageUrl: string;
  price: number;
  title: string;
  userId: string;
  location: PlaceLocation;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  private _places = new BehaviorSubject<Place[]>([]);

  get places() {
    return this._places.asObservable();
  }

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) { }

  fetchPlaces() {
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http
          .get<{ [key: string]: PlaceData }>(
            `https://ionic-places-couse.firebaseio.com/offered-places.json?auth=${token
            }`
          )
      }),
      map(resData => {
        console.log('DATA FROM FIREBASE:fetchPlaces: ', resData);
        const places = [];
        for (const key in resData) {
          if (resData.hasOwnProperty(key)) {
            places.push(
              new Place(
                key,
                resData[key].title,
                resData[key].description,
                resData[key].imageUrl,
                resData[key].price,
                new Date(resData[key].availableFrom),
                new Date(resData[key].availableTo),
                resData[key].userId,
                resData[key].location
              )
            );
          }
        }
        return places;
        // return []; Per mostrare la scritta
      }),
      tap(places => {
        this._places.next(places);
      })
    );
  }

  getPlace(id: string) {
    console.log('getPlace start');
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        return this.http
        .get<PlaceData>(
          `https://ionic-places-couse.firebaseio.com/offered-places/${id}.json?auth=${
            token
          }`
        )
    }),
    map(placeData => {
          return new Place(
            id,
            placeData.title,
            placeData.description,
            placeData.imageUrl,
            placeData.price,
            new Date(placeData.availableFrom),
            new Date(placeData.availableTo),
            placeData.userId,
            placeData.location
          );
        })
      );
  }

  uploadImage(image: File) {
    const uploadData = new FormData();
    uploadData.append('image', image);

    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
      return this.http.post<{ imageUrl: string, imagePath: string }>(
        'https://us-central1-ionic-places-couse.cloudfunctions.net/storeImage',
        uploadData, 
        {headers: {Authorization: 'Bearer ' + token} }
      );
    })
    );
  }

  addPlace(
    title: string,
    description: string,
    price: number,
    dateFrom: Date,
    dateTo: Date,
    location: PlaceLocation,
    imageUrl: string
  ) {
    let generatedId: string;
    let fetchedUserId: string;
    let newPlace: Place;
    return this.authService.userId.pipe(
      take(1),
      switchMap(userId => {
        fetchedUserId = userId;
        return this.authService.token;
      }),
      take(1),
      switchMap(token => {
        if (!fetchedUserId) {
          throw new Error('No user found!');
        }
        newPlace = new Place(
          Math.random().toString(),
          title,
          description,
          imageUrl,
          price,
          dateFrom,
          dateTo,
          fetchedUserId,
          location
        );
        return this.http.post<{ name: string }>(
          `https://ionic-places-couse.firebaseio.com/offered-places.json?auth=${
            token
          }`,
          {
            ...newPlace,
            id: null
          }
        );
      }),
      switchMap(resData => {
        generatedId = resData.name;
        return this.places;
      }),
      take(1),
      tap(places => {
        newPlace.id = generatedId;
        this._places.next(places.concat(newPlace));
      })
    );

    // return this.places.pipe(
    //   take(1),
    //   delay(1000),
    //   tap(places => {
    //     this._places.next(places.concat(newPlace));
    //   })
    // );  
  }

  updatePlace(placeId: string, title: string, description: string) {
    let updatedPlaces: Place[];
    let fetchedToken: string;
    return this.authService.token.pipe(
      take(1),
      switchMap(token => {
        fetchedToken = token;
        return this.places;
      }),
      take(1),
      switchMap(places => {
        if (!places || places.length <= 0) {
          return this.fetchPlaces();
        } else {
          return of(places);
        }
      }),
      switchMap(places => {
        const updatedPlaceIndex = places.findIndex(pl => pl.id === placeId);
        updatedPlaces = [...places];
        const oldPlace = updatedPlaces[updatedPlaceIndex];
        updatedPlaces[updatedPlaceIndex] = new Place(
          oldPlace.id,
          title,
          description,
          oldPlace.imageUrl,
          oldPlace.price,
          oldPlace.availableFrom,
          oldPlace.availableTo,
          oldPlace.userId,
          oldPlace.location
        );
        return this.http.put(
          `https://ionic-places-couse.firebaseio.com/offered-places/${placeId}.json?auth=${fetchedToken}`,
          { ...updatedPlaces[updatedPlaceIndex], id: null }
        );
      }),
      tap(() => {
        this._places.next(updatedPlaces);
      })
    );
  }
}
