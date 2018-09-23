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
        switchInput (item) {
            item.isEditing = true
        },
        fetchItems () {
            db.groups.orderBy('sort').each( group => {
                this.items.push(this.groupToItem(group));
            }).catch( error => {
                console.log(error);
            });
        },
    }
}
</script>
