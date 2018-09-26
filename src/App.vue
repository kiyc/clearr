<template>
    <v-app class="blue" dark>
        <v-content>
            <v-layout>
                <v-flex>
                    <v-list class="blue" dark>
                        <v-list-tile>
                            <v-list-tile-content>
                                <v-flex row>
                                    <v-btn fab flat small @click="switchGroups" v-if="!showGroups">
                                        <v-icon>arrow_back</v-icon>
                                    </v-btn>
                                    <v-btn fab flat small @click="showNewInput = true">
                                        <v-icon>add</v-icon>
                                    </v-btn>
                                </v-flex>
                            </v-list-tile-content>
                        </v-list-tile>
                        <v-list-tile v-if="showNewInput">
                            <v-list-tile-content>
                                <v-flex style="width:100%">
                                    <v-text-field
                                        v-model="newValue"
                                        placeholder="New Item"
                                        @blur="addItem"
                                        >
                                    </v-text-field>
                                </v-flex>
                            </v-list-tile-content>
                        </v-list-tile>
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
                                            <v-card flat slot="append-outer" v-if="item.isGroup" class="blue">
                                                <v-icon class="mt-2 mb-0" @click="switchTasks(item.id)">arrow_forward</v-icon>
                                            </v-card>
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
            showGroups: true,
            showNewInput: false,
            newValue: '',
            selectedGroupId: null,
        }
    },
    mounted () {
        this.fetchGroups();
    },
    methods: {
        groupToItem (group) {
            return {
                id: group.id,
                value: group.name,
                isGroup: true,
                isEditing: false,
            };
        },
        itemToGroup (item) {
            return {
                id: item.id,
                name: item.value,
            };
        },
        taskToItem (task) {
            return {
                id: task.id,
                value: task.text,
                groupsId: task.groups_id,
                isGroup: false,
                isEditing: false,
            };
        },
        itemToTask (item) {
            return {
                id: item.id,
                text: item.value,
                groups_id: item.groupsId,
            };
        },
        switchGroups () {
            this.showGroups = true;
            this.selectedGroupId = null;
            this.fetchGroups();
        },
        switchTasks (id) {
            this.showGroups = false;
            this.selectedGroupId = id;
            this.fetchTasks(id);
        },
        switchInput (item) {
            item.isEditing = true
        },
        fetchGroups () {
            db.groups.reverse().sortBy('sort').then( groups => {
                this.items = groups.map( group => { return this.groupToItem(group); } );
            }).catch( error => {
                console.log(error);
            });
        },
        fetchTasks (id) {
            db.tasks.where('groups_id').equals(id).reverse().sortBy('sort').then( tasks => {
                this.items = tasks.map( task => { return this.taskToItem(task); } );
            }).catch( error => {
                console.log(error);
            });
        },
        updateGroup (item) {
            let group = this.itemToGroup(item);
            db.groups.update(group.id, group).then( updated => {
                if (updated) {
                    this.fetchGroups();
                } else {
                    console.log('Error: db.groups.update()');
                }
            }).catch( error => {
                console.log(error);
            });
        },
        updateTask (item) {
            let task = this.itemToTask(item);
            db.tasks.update(task.id, task).then( updated => {
                if (updated) {
                    this.fetchTasks(task.groups_id);
                } else {
                    console.log('Error: db.groups.update()');
                }
            }).catch( error => {
                console.log(error);
            });
        },
        updateItem (item) {
            if (!this.showGroups && this.selectedGroupId) {
                this.updateTask(item);
            } else {
                this.updateGroup(item);
            }
        },
        clearNewInput () {
            this.showNewInput = false;
            this.newValue = '';
        },
        addGroup () {
            let group = {
                name: this.newValue,
                sort: this.items.length + 1,
                deleted: false,
            };
            db.groups.add(group).then( () => {
                this.clearNewInput();
                this.fetchGroups();
            }).catch( error => {
                console.log(error);
            });
        },
        addTask () {
            let task = {
                groups_id: this.selectedGroupId,
                text: this.newValue,
                sort: this.items.length + 1,
                deleted: false,
            };
            db.tasks.add(task).then( () => {
                this.clearNewInput();
                this.fetchTasks(this.selectedGroupId);
            }).catch( error => {
                console.log(error);
            });
        },
        addItem () {
            if (!this.newValue) {
                this.clearNewInput();
                return;
            }
            if (!this.showGroups && this.selectedGroupId) {
                this.addTask();
            } else {
                this.addGroup();
            }
        },
    }
}
</script>
