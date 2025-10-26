const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const fs = require('fs');

// Initialize Bedrock client
const bedrockClient = new BedrockRuntimeClient({
    region: 'us-east-1'
});

// Your gesture data
const gestureData = [
    { x: -0.210, y: -0.083, z: -1.121 },
    { x: -0.201, y: -0.051, z: -1.079 },
    { x: -0.280, y: -0.030, z: -1.118 },
    { x: -0.317, y: -0.093, z: -1.112 },
    { x: -0.284, y: -0.142, z: -1.052 },
    { x: -0.216, y: -0.128, z: -0.988 },
    { x: -0.172, y: -0.125, z: -0.980 },
    { x: -0.187, y: -0.159, z: -1.046 },
    { x: -0.238, y: -0.135, z: -1.083 }
];

class BedrockFANUCGenerator {
    constructor() {
        this.gestureData = gestureData;
    }

    async searchFANUCRequirements() {
        console.log('🔍 Searching Bedrock for FANUC-specific requirements...');
        
        const searchPrompt = `You are a senior FANUC robotics engineer with 15+ years experience in RoboGuide programming. 

Please provide detailed information about:
1. FANUC TP file format requirements for RoboGuide compatibility
2. Common causes of "ASCII to binary translation failed" errors
3. Proper TP file structure, headers, and syntax
4. Best practices for coordinate conversion (meters to mm)
5. Motion instruction formatting (J moves, speeds, termination types)
6. Position definition requirements (GP1, UF, UT, CONFIG)

Focus on industry-grade, production-ready FANUC TP programs that work reliably in RoboGuide.`;

        const params = {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 4000,
                temperature: 0.1,
                system: 'You are a senior FANUC robotics engineer with 15+ years experience in RoboGuide programming.',
                messages: [
                    {
                        role: 'user',
                        content: searchPrompt
                    }
                ]
            })
        };

        try {
            const command = new InvokeModelCommand(params);
            const response = await bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            
            console.log('✅ Bedrock research completed');
            return responseBody.content[0].text;
        } catch (error) {
            console.error('❌ Bedrock search failed:', error.message);
            return null;
        }
    }

    async generateFANUCTP() {
        console.log('🤖 Using Bedrock to generate FANUC TP file...');
        
        const systemPrompt = `You are a senior FANUC robotics engineer with 15+ years experience in RoboGuide programming. You specialize in creating industry-grade, production-ready FANUC TP programs that work flawlessly in RoboGuide.

Your expertise includes:
- FANUC TP file format specifications
- RoboGuide compatibility requirements
- Motion programming best practices
- Coordinate system conversions
- Error prevention and troubleshooting`;

        const userPrompt = `Create a FANUC TP program from this gesture data:

${JSON.stringify(this.gestureData, null, 2)}

Requirements:
1. Program name: GESTURE1 (8 characters max, no underscores)
2. Convert coordinates from meters to millimeters
3. Use Joint (J) moves with 100% speed and FINE termination
4. Include complete header with all required metadata
5. Format positions exactly like RoboGuide expects
6. Ensure ASCII to binary translation will succeed
7. Include proper GP1, UF, UT, CONFIG specifications
8. Use exact format that matches working RoboGuide samples

Generate a complete, ready-to-use TP file that will load without errors in RoboGuide.`;

        const params = {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 4000,
                temperature: 0.1,
                system: systemPrompt,
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ]
            })
        };

        try {
            const command = new InvokeModelCommand(params);
            const response = await bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            
            console.log('✅ Bedrock TP generation completed');
            return responseBody.content[0].text;
        } catch (error) {
            console.error('❌ Bedrock generation failed:', error.message);
            return null;
        }
    }

    async generateOptimizedVersions() {
        console.log('🎯 Generating multiple optimized versions...');
        
        const versions = [
            {
                name: 'single_point',
                data: this.gestureData.slice(0, 1),
                description: 'Single point test (simplest)'
            },
            {
                name: 'minimal',
                data: this.gestureData.slice(0, 2),
                description: 'Minimal 2-point program'
            },
            {
                name: 'full',
                data: this.gestureData,
                description: 'Full 9-point gesture program'
            }
        ];

        const results = [];

        for (const version of versions) {
            console.log(`🔄 Generating ${version.description}...`);
            
            // Temporarily replace data for this version
            const originalData = this.gestureData;
            this.gestureData = version.data;
            
            const tpContent = await this.generateFANUCTP();
            
            if (tpContent) {
                const filename = `gesture1_bedrock_${version.name}.tp`;
                fs.writeFileSync(filename, tpContent, 'utf8');
                
                const stats = fs.statSync(filename);
                results.push({
                    filename,
                    size: stats.size,
                    points: version.data.length,
                    description: version.description
                });
                
                console.log(`✅ Generated ${filename} (${stats.size} bytes)`);
            }
            
            // Restore original data
            this.gestureData = originalData;
        }

        return results;
    }

    async run() {
        console.log('🚀 Starting Bedrock-powered FANUC TP generation...');
        console.log('================================================');
        
        // Step 1: Research FANUC requirements
        const research = await this.searchFANUCRequirements();
        if (research) {
            fs.writeFileSync('bedrock_fanuc_research.txt', research, 'utf8');
            console.log('📚 Research saved to bedrock_fanuc_research.txt');
        }
        
        // Step 2: Generate optimized TP files
        const results = await this.generateOptimizedVersions();
        
        console.log('\n🎯 Generated Files:');
        console.log('==================');
        results.forEach(result => {
            console.log(`✅ ${result.filename}`);
            console.log(`   📊 ${result.points} points, ${result.size} bytes`);
            console.log(`   📝 ${result.description}`);
            console.log('');
        });
        
        console.log('🎯 Testing Order:');
        console.log('1. gesture1_bedrock_single_point.tp (simplest)');
        console.log('2. gesture1_bedrock_minimal.tp (2 points)');
        console.log('3. gesture1_bedrock_full.tp (full program)');
        
        console.log('\n🤖 These Bedrock-generated files should work perfectly in RoboGuide!');
    }
}

// Run the generator
const generator = new BedrockFANUCGenerator();
generator.run().catch(console.error);
