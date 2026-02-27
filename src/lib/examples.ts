export const EXAMPLE_PROGRAMS = [
  {
    name: '인사하기',
    description: '로봇이 손을 흔들며 인사합니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">wave</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">1</field>
            <next>
              <block type="humanoid_head">
                <field name="YAW">30</field>
                <field name="PITCH">-10</field>
                <next>
                  <block type="humanoid_wait">
                    <field name="DURATION">0.5</field>
                    <next>
                      <block type="humanoid_head">
                        <field name="YAW">-30</field>
                        <field name="PITCH">-10</field>
                        <next>
                          <block type="humanoid_wait">
                            <field name="DURATION">0.5</field>
                            <next>
                              <block type="humanoid_head">
                                <field name="YAW">0</field>
                                <field name="PITCH">0</field>
                                <next>
                                  <block type="humanoid_reset"></block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '걷기',
    description: '로봇이 앞으로 걸어갑니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">walk_ready</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">0.5</field>
            <next>
              <block type="humanoid_move_forward">
                <field name="DISTANCE">3</field>
                <next>
                  <block type="humanoid_wait">
                    <field name="DURATION">0.5</field>
                    <next>
                      <block type="humanoid_reset"></block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '뛰기',
    description: '로봇이 빠르게 뛰는 동작을 합니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="controls_repeat_ext">
        <value name="TIMES">
          <shadow type="math_number">
            <field name="NUM">6</field>
          </shadow>
        </value>
        <statement name="DO">
          <block type="humanoid_set_leg">
            <field name="LEG">left</field>
            <field name="HIP_PITCH">-45</field>
            <field name="HIP_YAW">0</field>
            <field name="KNEE">90</field>
            <field name="ANKLE">-20</field>
            <next>
              <block type="humanoid_set_leg">
                <field name="LEG">right</field>
                <field name="HIP_PITCH">20</field>
                <field name="HIP_YAW">0</field>
                <field name="KNEE">0</field>
                <field name="ANKLE">20</field>
                <next>
                  <block type="humanoid_set_arm">
                    <field name="ARM">right</field>
                    <field name="SHOULDER_PITCH">-40</field>
                    <field name="SHOULDER_YAW">0</field>
                    <field name="ELBOW">-45</field>
                    <field name="WRIST">0</field>
                    <next>
                      <block type="humanoid_set_arm">
                        <field name="ARM">left</field>
                        <field name="SHOULDER_PITCH">30</field>
                        <field name="SHOULDER_YAW">0</field>
                        <field name="ELBOW">-45</field>
                        <field name="WRIST">0</field>
                        <next>
                          <block type="humanoid_wait">
                            <field name="DURATION">0.2</field>
                            <next>
                              <block type="humanoid_set_leg">
                                <field name="LEG">right</field>
                                <field name="HIP_PITCH">-45</field>
                                <field name="HIP_YAW">0</field>
                                <field name="KNEE">90</field>
                                <field name="ANKLE">-20</field>
                                <next>
                                  <block type="humanoid_set_leg">
                                    <field name="LEG">left</field>
                                    <field name="HIP_PITCH">20</field>
                                    <field name="HIP_YAW">0</field>
                                    <field name="KNEE">0</field>
                                    <field name="ANKLE">20</field>
                                    <next>
                                      <block type="humanoid_set_arm">
                                        <field name="ARM">left</field>
                                        <field name="SHOULDER_PITCH">-40</field>
                                        <field name="SHOULDER_YAW">0</field>
                                        <field name="ELBOW">-45</field>
                                        <field name="WRIST">0</field>
                                        <next>
                                          <block type="humanoid_set_arm">
                                            <field name="ARM">right</field>
                                            <field name="SHOULDER_PITCH">30</field>
                                            <field name="SHOULDER_YAW">0</field>
                                            <field name="ELBOW">-45</field>
                                            <field name="WRIST">0</field>
                                            <next>
                                              <block type="humanoid_wait">
                                                <field name="DURATION">0.2</field>
                                              </block>
                                            </next>
                                          </block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </statement>
        <next>
          <block type="humanoid_reset"></block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '댄스',
    description: '로봇이 신나게 춤을 춥니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="controls_repeat_ext">
        <value name="TIMES">
          <shadow type="math_number">
            <field name="NUM">2</field>
          </shadow>
        </value>
        <statement name="DO">
          <block type="humanoid_torso">
            <field name="ANGLE">30</field>
            <next>
              <block type="humanoid_set_arm">
                <field name="ARM">left</field>
                <field name="SHOULDER_PITCH">-30</field>
                <field name="SHOULDER_YAW">60</field>
                <field name="ELBOW">0</field>
                <field name="WRIST">0</field>
                <next>
                  <block type="humanoid_set_arm">
                    <field name="ARM">right</field>
                    <field name="SHOULDER_PITCH">0</field>
                    <field name="SHOULDER_YAW">0</field>
                    <field name="ELBOW">-90</field>
                    <field name="WRIST">0</field>
                    <next>
                      <block type="humanoid_set_leg">
                        <field name="LEG">left</field>
                        <field name="HIP_PITCH">0</field>
                        <field name="HIP_YAW">20</field>
                        <field name="KNEE">30</field>
                        <field name="ANKLE">0</field>
                        <next>
                          <block type="humanoid_wait">
                            <field name="DURATION">0.3</field>
                            <next>
                              <block type="humanoid_torso">
                                <field name="ANGLE">-30</field>
                                <next>
                                  <block type="humanoid_set_arm">
                                    <field name="ARM">right</field>
                                    <field name="SHOULDER_PITCH">-30</field>
                                    <field name="SHOULDER_YAW">-60</field>
                                    <field name="ELBOW">0</field>
                                    <field name="WRIST">0</field>
                                    <next>
                                      <block type="humanoid_set_arm">
                                        <field name="ARM">left</field>
                                        <field name="SHOULDER_PITCH">0</field>
                                        <field name="SHOULDER_YAW">0</field>
                                        <field name="ELBOW">-90</field>
                                        <field name="WRIST">0</field>
                                        <next>
                                          <block type="humanoid_set_leg">
                                            <field name="LEG">left</field>
                                            <field name="HIP_PITCH">0</field>
                                            <field name="HIP_YAW">0</field>
                                            <field name="KNEE">0</field>
                                            <field name="ANKLE">0</field>
                                            <next>
                                              <block type="humanoid_set_leg">
                                                <field name="LEG">right</field>
                                                <field name="HIP_PITCH">0</field>
                                                <field name="HIP_YAW">-20</field>
                                                <field name="KNEE">30</field>
                                                <field name="ANKLE">0</field>
                                                <next>
                                                  <block type="humanoid_wait">
                                                    <field name="DURATION">0.3</field>
                                                    <next>
                                                      <block type="humanoid_preset_pose">
                                                        <field name="POSE">clap</field>
                                                        <next>
                                                          <block type="humanoid_wait">
                                                            <field name="DURATION">0.3</field>
                                                            <next>
                                                              <block type="humanoid_set_arm">
                                                                <field name="ARM">left</field>
                                                                <field name="SHOULDER_PITCH">-30</field>
                                                                <field name="SHOULDER_YAW">80</field>
                                                                <field name="ELBOW">0</field>
                                                                <field name="WRIST">0</field>
                                                                <next>
                                                                  <block type="humanoid_set_arm">
                                                                    <field name="ARM">right</field>
                                                                    <field name="SHOULDER_PITCH">-30</field>
                                                                    <field name="SHOULDER_YAW">-80</field>
                                                                    <field name="ELBOW">0</field>
                                                                    <field name="WRIST">0</field>
                                                                    <next>
                                                                      <block type="humanoid_wait">
                                                                        <field name="DURATION">0.3</field>
                                                                        <next>
                                                                          <block type="humanoid_set_leg">
                                                                            <field name="LEG">right</field>
                                                                            <field name="HIP_PITCH">0</field>
                                                                            <field name="HIP_YAW">0</field>
                                                                            <field name="KNEE">0</field>
                                                                            <field name="ANKLE">0</field>
                                                                          </block>
                                                                        </next>
                                                                      </block>
                                                                    </next>
                                                                  </block>
                                                                </next>
                                                              </block>
                                                            </next>
                                                          </block>
                                                        </next>
                                                      </block>
                                                    </next>
                                                  </block>
                                                </next>
                                              </block>
                                            </next>
                                          </block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </statement>
        <next>
          <block type="humanoid_reset"></block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '박수치기',
    description: '로봇이 박수를 칩니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="controls_repeat_ext">
        <value name="TIMES">
          <shadow type="math_number">
            <field name="NUM">5</field>
          </shadow>
        </value>
        <statement name="DO">
          <block type="humanoid_preset_pose">
            <field name="POSE">clap</field>
            <next>
              <block type="humanoid_wait">
                <field name="DURATION">0.3</field>
                <next>
                  <block type="humanoid_set_arm">
                    <field name="ARM">left</field>
                    <field name="SHOULDER_PITCH">-70</field>
                    <field name="SHOULDER_YAW">40</field>
                    <field name="ELBOW">0</field>
                    <field name="WRIST">0</field>
                    <next>
                      <block type="humanoid_set_arm">
                        <field name="ARM">right</field>
                        <field name="SHOULDER_PITCH">-70</field>
                        <field name="SHOULDER_YAW">-40</field>
                        <field name="ELBOW">0</field>
                        <field name="WRIST">0</field>
                        <next>
                          <block type="humanoid_wait">
                            <field name="DURATION">0.3</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </statement>
        <next>
          <block type="humanoid_reset"></block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '절하기',
    description: '로봇이 공손하게 절을 합니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">stand</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">0.5</field>
            <next>
              <block type="humanoid_preset_pose">
                <field name="POSE">bow</field>
                <next>
                  <block type="humanoid_wait">
                    <field name="DURATION">1.5</field>
                    <next>
                      <block type="humanoid_preset_pose">
                        <field name="POSE">stand</field>
                        <next>
                          <block type="humanoid_wait">
                            <field name="DURATION">0.5</field>
                            <next>
                              <block type="humanoid_reset"></block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '스트레칭',
    description: '로봇이 스트레칭을 합니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">tpose</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">1</field>
            <next>
              <block type="humanoid_set_arm">
                <field name="ARM">left</field>
                <field name="SHOULDER_PITCH">-180</field>
                <field name="SHOULDER_YAW">0</field>
                <field name="ELBOW">0</field>
                <field name="WRIST">0</field>
                <next>
                  <block type="humanoid_set_arm">
                    <field name="ARM">right</field>
                    <field name="SHOULDER_PITCH">-180</field>
                    <field name="SHOULDER_YAW">0</field>
                    <field name="ELBOW">0</field>
                    <field name="WRIST">0</field>
                    <next>
                      <block type="humanoid_wait">
                        <field name="DURATION">1</field>
                        <next>
                          <block type="humanoid_torso">
                            <field name="ANGLE">45</field>
                            <next>
                              <block type="humanoid_wait">
                                <field name="DURATION">0.5</field>
                                <next>
                                  <block type="humanoid_torso">
                                    <field name="ANGLE">-45</field>
                                    <next>
                                      <block type="humanoid_wait">
                                        <field name="DURATION">0.5</field>
                                        <next>
                                          <block type="humanoid_torso">
                                            <field name="ANGLE">0</field>
                                            <next>
                                              <block type="humanoid_preset_pose">
                                                <field name="POSE">tpose</field>
                                                <next>
                                                  <block type="humanoid_wait">
                                                    <field name="DURATION">0.5</field>
                                                    <next>
                                                      <block type="humanoid_reset"></block>
                                                    </next>
                                                  </block>
                                                </next>
                                              </block>
                                            </next>
                                          </block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '점프',
    description: '로봇이 점프합니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">stand</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">0.5</field>
            <next>
              <block type="humanoid_set_leg">
                <field name="LEG">left</field>
                <field name="HIP_PITCH">-20</field>
                <field name="HIP_YAW">0</field>
                <field name="KNEE">40</field>
                <field name="ANKLE">-20</field>
                <next>
                  <block type="humanoid_set_leg">
                    <field name="LEG">right</field>
                    <field name="HIP_PITCH">-20</field>
                    <field name="HIP_YAW">0</field>
                    <field name="KNEE">40</field>
                    <field name="ANKLE">-20</field>
                    <next>
                      <block type="humanoid_wait">
                        <field name="DURATION">0.3</field>
                        <next>
                          <block type="humanoid_jump">
                            <field name="HEIGHT">1.5</field>
                            <next>
                              <block type="humanoid_set_leg">
                                <field name="LEG">left</field>
                                <field name="HIP_PITCH">0</field>
                                <field name="HIP_YAW">0</field>
                                <field name="KNEE">0</field>
                                <field name="ANKLE">0</field>
                                <next>
                                  <block type="humanoid_set_leg">
                                    <field name="LEG">right</field>
                                    <field name="HIP_PITCH">0</field>
                                    <field name="HIP_YAW">0</field>
                                    <field name="KNEE">0</field>
                                    <field name="ANKLE">0</field>
                                    <next>
                                      <block type="humanoid_wait">
                                        <field name="DURATION">0.5</field>
                                        <next>
                                          <block type="humanoid_reset"></block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '고개 끄덕이기 (Yes)',
    description: '로봇이 고개를 끄덕여 긍정을 표현합니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">stand</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">0.3</field>
            <next>
              <block type="controls_repeat_ext">
                <value name="TIMES">
                  <shadow type="math_number">
                    <field name="NUM">3</field>
                  </shadow>
                </value>
                <statement name="DO">
                  <block type="humanoid_head">
                    <field name="YAW">0</field>
                    <field name="PITCH">25</field>
                    <next>
                      <block type="humanoid_wait">
                        <field name="DURATION">0.2</field>
                        <next>
                          <block type="humanoid_head">
                            <field name="YAW">0</field>
                            <field name="PITCH">-10</field>
                            <next>
                              <block type="humanoid_wait">
                                <field name="DURATION">0.2</field>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
                <next>
                  <block type="humanoid_head">
                    <field name="YAW">0</field>
                    <field name="PITCH">0</field>
                    <next>
                      <block type="humanoid_reset"></block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '고개 젓기 (No)',
    description: '로봇이 고개를 저어 부정을 표현합니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">stand</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">0.3</field>
            <next>
              <block type="controls_repeat_ext">
                <value name="TIMES">
                  <shadow type="math_number">
                    <field name="NUM">3</field>
                  </shadow>
                </value>
                <statement name="DO">
                  <block type="humanoid_head">
                    <field name="YAW">40</field>
                    <field name="PITCH">0</field>
                    <next>
                      <block type="humanoid_wait">
                        <field name="DURATION">0.15</field>
                        <next>
                          <block type="humanoid_head">
                            <field name="YAW">-40</field>
                            <field name="PITCH">0</field>
                            <next>
                              <block type="humanoid_wait">
                                <field name="DURATION">0.15</field>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
                <next>
                  <block type="humanoid_head">
                    <field name="YAW">0</field>
                    <field name="PITCH">0</field>
                    <next>
                      <block type="humanoid_reset"></block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '펀치',
    description: '로봇이 펀치를 날립니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">stand</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">0.3</field>
            <next>
              <block type="humanoid_set_arm">
                <field name="ARM">right</field>
                <field name="SHOULDER_PITCH">-45</field>
                <field name="SHOULDER_YAW">-30</field>
                <field name="ELBOW">-90</field>
                <field name="WRIST">0</field>
                <next>
                  <block type="humanoid_gripper">
                    <field name="HAND">right</field>
                    <field name="ACTION">close</field>
                    <next>
                      <block type="humanoid_wait">
                        <field name="DURATION">0.3</field>
                        <next>
                          <block type="humanoid_torso">
                            <field name="ANGLE">-30</field>
                            <next>
                              <block type="humanoid_set_arm">
                                <field name="ARM">right</field>
                                <field name="SHOULDER_PITCH">-90</field>
                                <field name="SHOULDER_YAW">0</field>
                                <field name="ELBOW">0</field>
                                <field name="WRIST">0</field>
                                <next>
                                  <block type="humanoid_wait">
                                    <field name="DURATION">0.5</field>
                                    <next>
                                      <block type="humanoid_torso">
                                        <field name="ANGLE">0</field>
                                        <next>
                                          <block type="humanoid_gripper">
                                            <field name="HAND">right</field>
                                            <field name="ACTION">open</field>
                                            <next>
                                              <block type="humanoid_reset"></block>
                                            </next>
                                          </block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '엄지척 (ThumbsUp)',
    description: '로봇이 엄지를 들어 올립니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">stand</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">0.3</field>
            <next>
              <block type="humanoid_set_arm">
                <field name="ARM">right</field>
                <field name="SHOULDER_PITCH">-60</field>
                <field name="SHOULDER_YAW">-45</field>
                <field name="ELBOW">-90</field>
                <field name="WRIST">0</field>
                <next>
                  <block type="humanoid_gripper">
                    <field name="HAND">right</field>
                    <field name="ACTION">close</field>
                    <next>
                      <block type="humanoid_wait">
                        <field name="DURATION">1</field>
                        <next>
                          <block type="humanoid_head">
                            <field name="YAW">-20</field>
                            <field name="PITCH">-10</field>
                            <next>
                              <block type="humanoid_wait">
                                <field name="DURATION">1</field>
                                <next>
                                  <block type="humanoid_head">
                                    <field name="YAW">0</field>
                                    <field name="PITCH">0</field>
                                    <next>
                                      <block type="humanoid_gripper">
                                        <field name="HAND">right</field>
                                        <field name="ACTION">open</field>
                                        <next>
                                          <block type="humanoid_reset"></block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '앉기',
    description: '로봇이 앉습니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">stand</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">0.5</field>
            <next>
              <block type="humanoid_set_leg">
                <field name="LEG">left</field>
                <field name="HIP_PITCH">-90</field>
                <field name="HIP_YAW">0</field>
                <field name="KNEE">90</field>
                <field name="ANKLE">0</field>
                <next>
                  <block type="humanoid_set_leg">
                    <field name="LEG">right</field>
                    <field name="HIP_PITCH">-90</field>
                    <field name="HIP_YAW">0</field>
                    <field name="KNEE">90</field>
                    <field name="ANKLE">0</field>
                    <next>
                      <block type="humanoid_set_arm">
                        <field name="ARM">left</field>
                        <field name="SHOULDER_PITCH">-45</field>
                        <field name="SHOULDER_YAW">30</field>
                        <field name="ELBOW">-90</field>
                        <field name="WRIST">0</field>
                        <next>
                          <block type="humanoid_set_arm">
                            <field name="ARM">right</field>
                            <field name="SHOULDER_PITCH">-45</field>
                            <field name="SHOULDER_YAW">-30</field>
                            <field name="ELBOW">-90</field>
                            <field name="WRIST">0</field>
                            <next>
                              <block type="humanoid_wait">
                                <field name="DURATION">2</field>
                                <next>
                                  <block type="humanoid_reset"></block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '쓰러지기 (Death)',
    description: '로봇이 쓰러집니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">stand</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">0.5</field>
            <next>
              <block type="humanoid_head">
                <field name="YAW">0</field>
                <field name="PITCH">30</field>
                <next>
                  <block type="humanoid_set_arm">
                    <field name="ARM">left</field>
                    <field name="SHOULDER_PITCH">30</field>
                    <field name="SHOULDER_YAW">60</field>
                    <field name="ELBOW">0</field>
                    <field name="WRIST">0</field>
                    <next>
                      <block type="humanoid_set_arm">
                        <field name="ARM">right</field>
                        <field name="SHOULDER_PITCH">30</field>
                        <field name="SHOULDER_YAW">-60</field>
                        <field name="ELBOW">0</field>
                        <field name="WRIST">0</field>
                        <next>
                          <block type="humanoid_wait">
                            <field name="DURATION">0.3</field>
                            <next>
                              <block type="humanoid_set_leg">
                                <field name="LEG">left</field>
                                <field name="HIP_PITCH">-30</field>
                                <field name="HIP_YAW">0</field>
                                <field name="KNEE">60</field>
                                <field name="ANKLE">-30</field>
                                <next>
                                  <block type="humanoid_set_leg">
                                    <field name="LEG">right</field>
                                    <field name="HIP_PITCH">-30</field>
                                    <field name="HIP_YAW">0</field>
                                    <field name="KNEE">60</field>
                                    <field name="ANKLE">-30</field>
                                    <next>
                                      <block type="humanoid_torso">
                                        <field name="ANGLE">15</field>
                                        <next>
                                          <block type="humanoid_wait">
                                            <field name="DURATION">0.5</field>
                                            <next>
                                              <block type="humanoid_set_leg">
                                                <field name="LEG">left</field>
                                                <field name="HIP_PITCH">-90</field>
                                                <field name="HIP_YAW">20</field>
                                                <field name="KNEE">30</field>
                                                <field name="ANKLE">0</field>
                                                <next>
                                                  <block type="humanoid_set_leg">
                                                    <field name="LEG">right</field>
                                                    <field name="HIP_PITCH">-90</field>
                                                    <field name="HIP_YAW">-20</field>
                                                    <field name="KNEE">30</field>
                                                    <field name="ANKLE">0</field>
                                                    <next>
                                                      <block type="humanoid_wait">
                                                        <field name="DURATION">2</field>
                                                        <next>
                                                          <block type="humanoid_reset"></block>
                                                        </next>
                                                      </block>
                                                    </next>
                                                  </block>
                                                </next>
                                              </block>
                                            </next>
                                          </block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
  {
    name: '아이들 (Idle)',
    description: '로봇이 가만히 서서 숨쉬는 동작을 합니다',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="humanoid_reset" x="20" y="20">
    <next>
      <block type="humanoid_preset_pose">
        <field name="POSE">stand</field>
        <next>
          <block type="humanoid_wait">
            <field name="DURATION">0.3</field>
            <next>
              <block type="controls_repeat_ext">
                <value name="TIMES">
                  <shadow type="math_number">
                    <field name="NUM">3</field>
                  </shadow>
                </value>
                <statement name="DO">
                  <block type="humanoid_set_arm">
                    <field name="ARM">left</field>
                    <field name="SHOULDER_PITCH">5</field>
                    <field name="SHOULDER_YAW">15</field>
                    <field name="ELBOW">-5</field>
                    <field name="WRIST">0</field>
                    <next>
                      <block type="humanoid_set_arm">
                        <field name="ARM">right</field>
                        <field name="SHOULDER_PITCH">5</field>
                        <field name="SHOULDER_YAW">-15</field>
                        <field name="ELBOW">-5</field>
                        <field name="WRIST">0</field>
                        <next>
                          <block type="humanoid_head">
                            <field name="YAW">5</field>
                            <field name="PITCH">5</field>
                            <next>
                              <block type="humanoid_wait">
                                <field name="DURATION">1</field>
                                <next>
                                  <block type="humanoid_set_arm">
                                    <field name="ARM">left</field>
                                    <field name="SHOULDER_PITCH">-5</field>
                                    <field name="SHOULDER_YAW">10</field>
                                    <field name="ELBOW">0</field>
                                    <field name="WRIST">0</field>
                                    <next>
                                      <block type="humanoid_set_arm">
                                        <field name="ARM">right</field>
                                        <field name="SHOULDER_PITCH">-5</field>
                                        <field name="SHOULDER_YAW">-10</field>
                                        <field name="ELBOW">0</field>
                                        <field name="WRIST">0</field>
                                        <next>
                                          <block type="humanoid_head">
                                            <field name="YAW">-5</field>
                                            <field name="PITCH">-5</field>
                                            <next>
                                              <block type="humanoid_wait">
                                                <field name="DURATION">1</field>
                                              </block>
                                            </next>
                                          </block>
                                        </next>
                                      </block>
                                    </next>
                                  </block>
                                </next>
                              </block>
                            </next>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
                <next>
                  <block type="humanoid_reset"></block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </next>
  </block>
</xml>`,
  },
];
