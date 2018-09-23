<template>
    <v-app class="blue" dark>
        <v-content>
            <v-layout>
                <v-flex>
                    <v-list class="blue" dark>
                        <template v-for="(item, idx) in items">
                            <v-list-tile :key="idx">
                                <v-list-tile-content>
                                    <v-flex style="width:100%">
                                        <v-text-field
                                            v-model="item.value"
                                            :readonly="!item.isEditing"
                                            @click="switchInput(item)"
                                            @blur="updateItem(item)"
                                            >
                                        </v-text-field>
                                    </v-flex>
                                </v-list-tile-content>
                            </v-list-tile>
                        </template>
                    </v-list>
                </v-flex>
            </v-layout>
        </v-content>
    </v-app>
</template>

<script>
/* eslint-disable no-console */

import db from './db';

export default {
    name: 'App',
    data () {
        return {
            items: [],
        }
    },
    mounted () {
        this.fetchItems();
    },
    methods: {
        groupToItem (group) {
            return {
                id: group.id,
                value: group.name,
                isEditing: false,
            };
        },
        itemToGroup (item) {
            return {
                id: item.id,
                name: item.value,
            };
        },
        switchInput (item) {
            item.isEditing = true
        },
        fetchItems () {
            let newItems = [];
            db.groups.orderBy('sort').each( group => {
                newItems.push(this.groupToItem(group));
            }).then( () => {
                this.items = newItems;
            }).catch( error => {
                console.log(error);
            });
        },
        updateItem (item) {
            let group = this.itemToGroup(item);
            db.groups.update(group.id, group).then( updated => {
                if (updated) {
                    this.fetchItems();
                } else {
                    console.log('Error: db.groups.update()');
                }
            }).catch( error => {
                console.log(error);
            });
        },
    }
}
</script>
