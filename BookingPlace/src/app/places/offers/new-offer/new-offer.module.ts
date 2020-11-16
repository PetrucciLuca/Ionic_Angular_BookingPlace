import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { NewOfferPageRoutingModule } from './new-offer-routing.module';
import { SharedModule } from '../../../shared/shared.module';
import { NewOfferPage } from './new-offer.page';


@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    NewOfferPageRoutingModule,
    SharedModule
  ],
  declarations: [NewOfferPage]
})
export class NewOfferPageModule {}
