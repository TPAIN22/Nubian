
import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';

export default function TestFetch() {
    const [log, setLog] = useState<string[]>([]);
    const [status, setStatus] = useState<string>('Idle');

    const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    const runTest = async () => {
        setLog([]);
        setStatus('Testing...');
        addLog('Starting fetch test...');

        try {
            // Test 1: Simple GET to root
            addLog('1. Fetching https://nubian-lne4.onrender.com/ping ...');
            const res1 = await fetch('https://nubian-lne4.onrender.com/ping');
            addLog(`Status: ${res1.status}`);
            const text1 = await res1.text();
            addLog(`Body: ${text1.substring(0, 50)}`);

            // Test 2: API Home
            addLog('2. Fetching https://nubian-lne4.onrender.com/api/home ...');
            const res2 = await fetch('https://nubian-lne4.onrender.com/api/home');
            addLog(`Status: ${res2.status}`);
            const text2 = await res2.text(); // Might be empty 204 or JSON
            addLog(`Body: ${text2.substring(0, 100)}`);

            setStatus('Success');
        } catch (err: any) {
            addLog(`ERROR: ${err.message}`);
            addLog(`Cause: ${JSON.stringify(err.cause || {})}`);
            setStatus('Failed');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Connection Test</Text>
            <Button title="Run Network Test" onPress={runTest} />
            <Text style={styles.status}>Status: {status}</Text>
            <View style={styles.logs}>
                {log.map((l, i) => <Text key={i} style={styles.logText}>{l}</Text>)}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#f0f0f0' },
    header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
    status: { fontSize: 16, marginVertical: 10, fontWeight: '600' },
    logs: { marginTop: 10, padding: 10, backgroundColor: 'white', borderRadius: 5 },
    logText: { fontSize: 12, marginBottom: 4, fontFamily: 'monospace' }
});
