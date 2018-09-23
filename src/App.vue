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
export default {
    name: 'App',
    data () {
        return {
            items: [
            { id: 1, value: 'hello!', isEditing: false },
            { id: 2, value: 'good bye!', isEditing: false },
            { id: 3, value: 'good night', isEditing: false },
            { id: 4, value: 'zzz...', isEditing: false },
            ],
        }
    },
    methods: {
        switchInput (item) {
            item.isEditing = true
        },
    }
}
</script>
