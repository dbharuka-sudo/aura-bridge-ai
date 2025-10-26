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

class RefinedBedrockFANUCGenerator {
    constructor() {
        this.gestureData = gestureData;
    }

    async generateRefinedFANUCTP(dataPoints) {
        console.log(`🤖 Generating refined FANUC TP for ${dataPoints.length} points...`);
        
        const systemPrompt = `You are a senior FANUC robotics engineer with 15+ years experience in RoboGuide programming. You specialize in creating TP files that work flawlessly in RoboGuide without ASCII to binary translation errors.

CRITICAL REQUIREMENTS:
- Use EXACT format matching working RoboGuide samples
- Program name must be 8 characters max, no underscores
- Convert meters to millimeters (multiply by 1000)
- Use Joint (J) moves with 100% speed and FINE termination
- Include complete header with proper metadata
- Format positions with GP1, UF, UT, CONFIG exactly as RoboGuide expects
- Ensure proper line endings and encoding
- No special characters or binary data`;

        const userPrompt = `Create a FANUC TP program from this gesture data:

${JSON.stringify(dataPoints, null, 2)}

IMPORTANT: Use this EXACT format structure:

/PROG  GESTURE1
/ATTR
OWNER		= MNEDITOR;
COMMENT		= "";
PROG_SIZE	= 514;
CREATE		= DATE 25-10-26  TIME 02:14:06;
MODIFIED	= DATE 25-10-26  TIME 02:14:44;
FILE_NAME	= ;
VERSION		= 0;
LINE_COUNT	= [NUMBER_OF_POINTS];
MEMORY_SIZE	= 878;
PROTECT		= READ_WRITE;
TCD:  STACK_SIZE	= 0,
      TASK_PRIORITY	= 50,
      TIME_SLICE	= 0,
      BUSY_LAMP_OFF	= 0,
      ABORT_REQUEST	= 0,
      PAUSE_REQUEST	= 0;
DEFAULT_GROUP	= 1,*,*,*,*;
CONTROL_CODE	= 00000000 00000000;
/MN
   1:J P[1] 100% FINE    ;
   2:J P[2] 100% FINE    ;
   [etc...]
/POS
P[1]{
   GP1:
	UF : 0, UT : 1,		CONFIG : 'N U T, 0, 0, 0',
	X =  [X_VALUE]  mm,	Y =  [Y_VALUE]  mm,	Z =  [Z_VALUE]  mm,
	W =     0.000 deg,	P =     0.000 deg,	R =     0.000 deg
};
P[2]{
   GP1:
	UF : 0, UT : 1,		CONFIG : 'N U T, 0, 0, 0',
	X =  [X_VALUE]  mm,	Y =  [Y_VALUE]  mm,	Z =  [Z_VALUE]  mm,
	W =     0.000 deg,	P =     0.000 deg,	R =     0.000 deg
};
[etc...]
/END

Convert coordinates from meters to millimeters. Generate ONLY the TP file content, no explanations.`;

        const params = {
            modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
            contentType: 'application/json',
            accept: 'application/json',
            body: JSON.stringify({
                anthropic_version: 'bedrock-2023-05-31',
                max_tokens: 4000,
                temperature: 0.0, // Use deterministic output
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
            
            return responseBody.content[0].text;
        } catch (error) {
            console.error('❌ Bedrock generation failed:', error.message);
            return null;
        }
    }

    async generateAllVersions() {
        console.log('🎯 Generating refined Bedrock TP files...');
        console.log('==========================================');
        
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
            
            const tpContent = await this.generateRefinedFANUCTP(version.data);
            
            if (tpContent) {
                const filename = `gesture1_refined_bedrock_${version.name}.tp`;
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
        }

        return results;
    }

    async run() {
        console.log('🚀 Starting Refined Bedrock FANUC TP Generation...');
        console.log('================================================');
        
        const results = await this.generateAllVersions();
        
        console.log('\n🎯 Generated Refined Files:');
        console.log('==========================');
        results.forEach(result => {
            console.log(`✅ ${result.filename}`);
            console.log(`   📊 ${result.points} points, ${result.size} bytes`);
            console.log(`   📝 ${result.description}`);
            console.log('');
        });
        
        console.log('🎯 Testing Order:');
        console.log('1. gesture1_refined_bedrock_single_point.tp (simplest)');
        console.log('2. gesture1_refined_bedrock_minimal.tp (2 points)');
        console.log('3. gesture1_refined_bedrock_full.tp (full program)');
        
        console.log('\n🤖 These refined Bedrock files use exact RoboGuide format!');
        console.log('💡 They should work without ASCII to binary translation errors!');
    }
}

// Run the refined generator
const generator = new RefinedBedrockFANUCGenerator();
generator.run().catch(console.error);
